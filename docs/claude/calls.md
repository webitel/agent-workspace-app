# Calls

State as of 2026-09-24 (step 4 of US_16.01), branch `feat/WTEL-WS-13/numpad-call`.
Verify against the code before asserting anything.

Covers `src/features/calls/` (domain), `src/ui/numpad/` (the numpad) and `src/ui/dialer/`
(the dialer panel and outbound call card), plus `e2e/outbound-call.spec.ts`. Ported from
`cc-workspaces`; its mechanism is described in
`cc-workspaces/docs/call-header-call-mechanism.md` (not in this repo).

## Where calls come from

The SDK `Client` owns the calls. `webSocketClientManager.ts` wraps `cli.callStore` in
`reactive`, so `useWebSocketClient().calls` (`client.allCall()`) is a live, reactive list and
SDK field changes (`allowHangup`, `active`, `isHold`, ...) reach the UI without events.

- `client.subscribeCall(handler, null)` must be called even if the handler did nothing — the
  SDK does not populate its call store without a subscriber. It runs once in
  `useCallsStore().initialize()`, started from `app/stores/workspace.ts`.
- Store state is **derived**, not copied: `callList`, `incomingOffers` are computeds over the
  SDK list. There is no `ADD_CALL` / `REMOVE_CALL` as in cc-workspaces; a call disappears on
  `Destroy` because the SDK removes it.
- The handler (`onCallEvent`) therefore only deals with things the store can't derive —
  today, media.

## Remote audio — the trap

The SDK negotiates WebRTC but **never attaches the remote stream to an output**. Without our
handler every call (inbound answered or outbound) connects silently. Before WTEL-WS-13 that
was the case in this repo.

`features/calls/composables/useCallAudio.ts` plays `call.peerStreams.at(-1)` on
`CallActions.PeerStream` and stops on `Hangup` / `Destroy`. Elements live in a `Map` by call
id, not on the SDK object (cc-workspaces used `call.workspaceAudio`).

## Outbound call (US_16.01, AC_16.01.01–03)

`numpad` panel (`ui/numpad/`) → emits the typed number → `outboundCallStore.dial()` →
`callsStore.call()`, and the panel closes immediately (AC_16.01.03). Anything that starts
an outbound call the agent should follow (contacts, history later) goes through `dial()`.

`callsStore.call()` resolves to whether the platform accepted the request:
1. `toDialableDestination` strips everything but `0-9a-zA-Z+*#` (same rule as cc-workspaces);
2. `isDialing` guards against a double click while the request is in flight;
3. microphone gate (`ensureMicrophoneAllowed`, shared with `answer`) — cc-workspaces had no
   gate on outbound; added so outbound behaves like answer;
4. holds the call the agent is currently on (`active && !isHold && allowHold`);
5. `client.call({ destination, params: { disableStun } })`; a rejection shows
   `error.calls.outboundCallFailed`.

It writes nothing to state: the real `Call` arrives through the feed (`Ringing`,
`direction === Outbound`).

### The outbound attempt (`store/outboundCall.ts`, AC_16.01.03–05)

One attempt at a time: `destination` (as typed) + `placedCall` + derived `status`
(`OutboundCallStatus`: Dialing → Ringing → Answered, or → NoAnswer; Ended closes it).

- **Linking.** `client.call()` returns nothing that identifies the call, and `Ringing` can
  arrive before the request resolves. The attempt snapshots the call ids present at dial
  time and adopts the first *new outbound* call. An outbound call started elsewhere at the
  same moment (desk phone, another tab) could be adopted instead — accepted risk.
- **Outliving `Destroy`.** The SDK deletes the call from its store on `Destroy`
  (`callStore.delete` + `destroy` event; for queue calls with a task it waits for reporting).
  The attempt keeps the `Call` reference, whose final `answeredAt` / `hangupAt` stay
  readable, so No answer survives removal without copying fields.
- **Status** (`scripts/getOutboundCallStatus.ts`): answered = `answeredAt > 0` (the SDK's own
  `talking` uses it). The hangup cause is not inspected: AC_16.01.04 folds declined / not
  picked up / no connection into one No answer.
- **Hangup before `Ringing`** closes the card at once; the dial bookkeeping (`pendingDial`)
  outlives the card, and a call that still arrives afterwards is hung up, not adopted.
  Closing at once matters because `Ringing` may never come: with a registered web phone,
  `Client.call()` catches `phone.call()` failures itself (`handleError` → `error` event), so
  `callsStore.call()` still resolves `true`.
- `retry()` redials `destination` only from NoAnswer; `dismiss()` closes the attempt.
  Back to dialpad = `dismiss()` + `numpadStore.open(destination)`, done in the dialer panel,
  since a `features/` store shouldn't drive `ui/` state.
- A request refused by the platform (or blocked mic) drops the attempt; the error
  notification is the only feedback. A page reload loses the attempt; the call itself stays
  in the call list.

### Dialer UI (`ui/dialer/`, AC_16.01.03–05)

Figma: file New-WorkSpace, page "Dialer DES-721", frame `287:21711`. The numpad and the
outbound call card are variants of one "Dialer" card, so `the-dialer-panel.vue` hosts both:
an explicitly opened numpad wins, otherwise the card shows for Dialing/Ringing (ringing
state) and NoAnswer. Answered hides it — the active-call window is step 5.

- `outbound-call-card.vue` is presentational: `OutboundCallPreview` (`ui/dialer/types`) +
  state + emits; the SDK `Call` is mapped by `features/calls/scripts/toOutboundCallPreview.ts`.
- `ringing-indicator.vue` reproduces the Figma motion "Motion 02 — Radiate" in CSS; each
  track animates its own property (`scale`, `rotate`, `translate`, `opacity`).
- Icons: the bell (ringing) and the "handset with a slash" (no answer) are not in the ui-sdk
  sprite (its `bell` is a different drawing); both are 24px placeholders until the icons are
  added. The ripple ring in `ui/dialer/assets/ringing-ellipse.svg` is a Figma export (the
  sprite has no such shape); its colour is baked in, so it does
  not follow the dark theme.
- The generated `--wt-ws-dialer-*` / `--wt-ws-client-identity-block-*` tokens exist in
  `@webitel/styleguide` (`token-generation/apps/agent-workspace-app`) but are neither in
  `ui-sdk.css` nor in the package `exports`, so the card uses the general tokens
  (`--success-light-color`, `--warning-light-color`, `--divider-border-color`, spacing).
- `wt-chip` `success`/`warning` are solid fills; the design wants light tints. Closest
  library match used until the design system gets a tint variant.

### Deliberate divergence: no "new call" stub

cc-workspaces put a fake task `{ _isNew: true, newNumber }` into the workspace so its call
page (which contained the numpad as a tab) could render before a call existed, then swapped
it for the real `Call` on `Ringing`. Here the numpad is a standalone panel and closes on
dial, so no screen needs a call-that-doesn't-exist yet. The typed number is local state of
`the-numpad.vue`. The stub would have forced a `Call | stub` union and `_isNew` checks into
every consumer.

## Incoming offers

`incomingOffers` = `callList.filter(isIncomingCallOffer)`; a watcher maps them onto the
channel-neutral notifications module (`ui/notifications`, contract in
`IncomingInteraction.types.ts`). Accept → `answer`, decline → `hangup`. The predicate's
clauses and their production bugs are documented in `scripts/isIncomingCallOffer.ts`.

## Known problems (2026-09-24)

- **STUN / web-device settings are ignored.** cc-workspaces fetched
  `GET /api/user/settings/phone` (`stun`, `webrtc`), merged it into the config and wrote it to
  `localStorage.CONFIG`. Nothing in this repo writes `CONFIG`, so `getStunEnabled()` (calls
  store) and `getCliConfig()` (socket manager) always fall back to defaults. The defaults also
  differ: cc-workspaces ended up with `disableStun: true` when the API gave nothing, this repo
  sends `false`. Needs its own ticket (probably `features/.../api` + `AppConfig`).
- `useWebSocketClient.test.ts` `connect` cases time out — pre-existing, unrelated to calls.

## Open questions — verify on a live instance

- Does `answeredAt` really mean "the callee answered" for an outbound web-phone call? The
  SDK sets it on the first `active`; for outbound, `bridgedAt` is only set by a separate
  `bridge` event. If the platform answers the agent's leg first (early media, IVR), the
  attempt would show Answered too early — then switch `getOutboundCallStatus` to `bridgedAt`.
- Could our own outbound call raise an *incoming* offer? `Call.allowAnswer` is
  `client.phone && !answered && !hungUp && (queue || inbound || params)`, so an outbound
  call with `params` is answerable, and `isIncomingCallOffer` accepts outbound calls with
  `allowAnswer && params && !params.autoAnswer` (WTEL-3602). Safe only if the platform sends
  `autoAnswer: true` for browser-originated calls — unverified.
- The hangup cause for AC_16.01.04 is no longer needed (see above).
- `e2e/outbound-call.spec.ts` dials with the web device unregistered (socket `call_invite`),
  so it does not exercise the SIP path a real agent uses.

## Next (US_16.01)

5. On answer, swap to the active-call mini-window (AC_16.01.06). `open_new_interaction_card`
   (E28) is out of scope.
