# 1. Incoming interaction offers

Date: 2026-09-18

## Status

Accepted. Implemented by [WS-32](https://webitel.atlassian.net/browse/WS-32)
(calls, US_14.01) and [WS-19](https://webitel.atlassian.net/browse/WS-19)
(chats, US_06.01).

## Context

An agent must be told, from anywhere in the app, that a call or a chat has been
distributed to them, and be able to accept or reject it without navigating.

Two constraints shaped this before any code was written.

**One design covers both channels.** `DES-727` ("Incoming interaction preview")
specifies a single preview for calls *and* chats — same corner, same layout,
same waiting indicator. The two stories are a week apart and share an assignee.
Shaping the contract call-first would have guaranteed a rename across the
component, its tests and the producer.

**The two channels arrive through different SDK surfaces.** Calls come from
`client.subscribeCall` and a reactive `Call` store; chats come from
`client.subscribeTask` filtered to `channel === 'im'`. Neither carries a usable
"is this being offered" flag:

| | what the SDK offers | why it is unusable |
|---|---|---|
| calls | `call.allowAnswer` | usable, but alone it also matches outbound legs and eavesdropped calls |
| chats | `allowAccept` / `allowDecline` / `allowClose` | all hardcoded to `channel === 'task'`, so all three are `false` for every `im` task |

`cc-workspaces` solves the same problem with an imperative `Map<id, notificationId>`
driven by call/task actions. Two production defects follow from that shape, and
both are reachable here: a card that survives an exit path nobody enumerated,
and — once a second offer can exist — an action resolving against the wrong
interaction.

## Decision

**The notifications module is separate from the domain features.** Domain stores
(`features/calls`, `features/chats`) call subscribers exposed by
`ui/notifications` and hand them data. Nothing under `ui/notifications` imports
`webitel-sdk` or `@webitel/chat-web-sdk`; nothing in a domain store renders.

**The contract is channel-neutral.** `IncomingInteractionPreview` carries
`kind`, `name`, `identifier`, `source`, `body`, `waitingSince` and `maxWaitSec`.
Calls fill `identifier` with a (possibly masked) number and `source` with the
queue; chats fill them with a username and, once the backend supplies it, the
gateway. Producers map their own SDK objects onto it.

**The preview is carried as a ref, never a snapshot**, so the card tracks the
live entity — the waiting timer ticks and late identification appears without
anyone pushing an update. The store keeps entries in a `shallowRef`; a deep
`ref([])` would unwrap the nested ref on property access and silently freeze it.

**Offers are derived, not pushed.** Each producer computes its offers from the
SDK's own reactive collection and watches that, diffing **by id** because the
SDK mutates its objects in place. A card therefore disappears on every exit —
accepted, declined, abandoned, redistributed, answered on another device or tab,
force-hung by a supervisor — without anyone enumerating terminal actions.

**Reconciliation is scoped by channel.** `retainOnly(kind, ids)` lives in the
notifications store, so a producer can only withdraw its own offers. A
call-feed update cannot dismiss a chat offer.

**A field is absent when we do not trust it.** Where the backend has no value —
the queue's max wait time, the queue-entry epoch, a chat's gateway — the field
stays `undefined` and the UI hides that part. An approximation is worse: a
counter started from the wrong epoch reads as fact, and `offeringAt` resets on
every redistribution, so the bar would go *greener* the longer a customer
actually waited.

## Consequences

The notifications module can be unit-tested without an SDK, and the chat
producer was additive — a predicate, a mapper and a subscriber call.

Producers own the awkward mappings, which is where the domain knowledge is:
masking a number to `*****678`, treating an empty `displayName` as "not
identified", failing closed on `hideContact`.

Offer cards ship with visible gaps until the backend catches up. The chat card
in particular has no source line, no waiting block and often no name. That is
deliberate, and it is the part most likely to be mistaken for a bug.

Deriving offers costs a `deep` watcher over the SDK collection. Diffing by id
is mandatory, not stylistic: array identity does not change when the SDK mutates
in place, and unrelated field writes re-run the watcher.

## Alternatives considered

**An imperative map keyed on actions** (the `cc-workspaces` shape, and this
app's original chat offer). Rejected: it requires naming every terminal action
correctly, and it leaks a stuck card whenever one is missed.

**Extending `wt-notifications-bar` with slots** so offers and toasts share one
mechanism. Rejected: offers are not toasts. They have no lifetime, they are
reconciled as a set, their content is live, and PrimeVue's built-in close icon
would remove a card without telling the store — leaving the ringtone playing for
an offer with no card. The shared *layer* was the real requirement and is solved
by `the-notifications-layer`; the library-level primitive is tracked as
[WTEL-10464](https://webitel.atlassian.net/browse/WTEL-10464).

## Known gaps

Tracked on [WS-16](https://webitel.atlassian.net/browse/WS-16) (calls) and
[WS-35](https://webitel.atlassian.net/browse/WS-35) (chats):

- `max_wait_time` on the queue payload — without it the progress bar stays hidden
- a queue-entry epoch — calls fall back to `call.createdAt`, which undercounts;
  chats show no waiting block at all
- the gateway a chat arrived through, for the `Channel` line

One assumption is unverified: chat offers are detected by
`state === JobState.Offering`, and nothing in this repo or `cc-workspaces`
demonstrates an `im` task in that state. If the backend uses `Distribute`
instead, no card appears **and** the previews list stops filtering — a failure
with no symptom.
