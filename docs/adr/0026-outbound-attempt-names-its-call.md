# 26. An outbound attempt is linked to its call by the ids the dial returns, elimination only without them

Date: 2026-11-19

## Status

Accepted. Implemented in [WS-155](https://webitel.atlassian.net/browse/WS-155)
on `webitel-sdk` 26.4.45, the release that returns the ids.

## Context

An **Outbound attempt** exists before its `Call` does: the call reaches the SDK
list only on `Ringing`. `client.call()` in `webitel-sdk` 26.4.44 resolves with
nothing, so `linkAttemptsToCalls` matched by elimination: the first new
outbound call nobody owns. An attempt stuck in Dialing (the SDK swallows a
failed `phone.call()`) then adopts a call dialled later on a desk phone or in
another tab, and since WS-155 the call dock expands for that call. Raised in
review of WS-155.

Socket events go to the user, not to the tab, so the call list cannot tell
which tab dialled. Only the dial itself can say which call it placed.

A change to `webitel-sdk` makes `Client.call` resolve with
`OutboundCallResult { callId?, sipId? }`. It was checked live through
`npm link`:

- With a web phone, the dial resolves with `sipId` (the web phone's session
  id: the SIP Call-ID followed by the from-tag) about 250 ms before the call
  rings. `call.sipId` is a prefix of it. With two tabs dialling, each matched
  only its own call.
- Without a web phone, `call_invite` returns `callId`, equal to `Call.id`, but
  only once the agent's own leg answers, so `Ringing` arrives first. Not
  checked live.

## Decision

`callsStore.call` returns `DialedCallIds | null` (`null` when nothing was
placed), copied from the SDK's `OutboundCallResult` by `toDialedCallIds`. The
attempt keeps the ids. `linkAttemptsToCalls` first gives an attempt with ids
only the call they name (`isDialedCall`: `callId` equal to `call.id`, or `sipId`
starting with `call.sipId`) and that was not listed when it dialled. It never
adopts another call by elimination. A call it took by elimination before the
ids came is given up as soon as the ids name another call, so until its own
call rings its card controls nothing. A call held only by elimination does not
count as owned against the ids: the attempt they name takes it, and the
attempt that held it goes back to Dialing. The same holds once that attempt is
gone (answered, closed): a call handed out earlier is claimed together with how
it was linked, and only a claim by the ids keeps it from another attempt's ids.
Otherwise an attempt whose `sipId` arrives after an attempt without ids took and
answered its call would stay in Dialing beside that call for good. Attempts
without ids (the request still open, an external phone, a failed web phone dial)
are matched by elimination as before, after the attempts with ids, so they
cannot take a call another attempt named, nor any claimed call. Linking reruns
on a change to the call list only: `webitel-sdk` 26.4.45 sets a call's `id` and
`sipId` when it creates the call and never later.

Only an attempt whose call its ids name announces the answer that expands the
call dock. A call linked by elimination may be one answered on a desk phone or
in another tab, so it stays a collapsed pill.

## Considered options

- **A link deadline** (an attempt older than N seconds stops adopting calls).
  Tried in WS-155 and dropped: the value is a product decision, and a slow but
  healthy attempt still loses its call.
- **A correlation id sent with the dial and returned on the call's events.**
  The web phone path sends only `X-Webitel-Display` / `X-Webitel-Contact-Id`
  and drops `params.variables`, so it needs backend and SDK work. The ids the
  dial already has are enough.
- **Linking only after the request resolves.** Without a web phone the id comes
  after the answer, so the card would never show Ringing.

## Consequences

- Without a web phone, the attempt is still linked by elimination while it
  rings, until the `callId` arrives. If it arrives only after the callee
  answered, the attempt has closed and the dock does not expand for that call.
- A failed `phone.call()` and an external phone both resolve without ids, so
  such an attempt can still adopt a foreign call. It no longer expands the dock
  for it. Telling a failure apart needs an `error` in `OutboundCallResult`.
- An attempt that has ids but whose call never comes (the web phone session
  fails after the dial) stays in Dialing, with no deadline (see the rejected
  link deadline above). It no longer adopts a foreign call.
