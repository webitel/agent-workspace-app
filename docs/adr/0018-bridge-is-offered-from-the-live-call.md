# 18. Bridging is offered from the live call, between any two Active calls

Date: 2026-11-16

## Status

Accepted. Implemented by [WS-95](https://webitel.atlassian.net/browse/WS-95).
Completes the bridging that [ADR-0017](0017-consult-call-is-derived.md) left
unbuilt. Not yet confirmed end to end on a live instance (see Consequences).

## Context

AC_14.02.07 gives the agent a way to join two **Active calls** so the agent
drops out and the two parties talk. BA (2026-11-13) said it is not a consult-only
feature: any two Active calls qualify, and with a single call the icon means
nothing. The SDK offers `call.bridgeTo(otherCall)` and says nothing about which
of the two calls has to be held. Bridging a Consult call from the held original
ended the call instead of handing the client to the other agent (2026-11-13,
live).

## Decision

**The bridge icon shows only while the agent has more than one Active call, and
only on a call that is not on hold** (`hasMultipleActiveCalls`, `canBridgeFrom`
in the dock lane). The agent bridges from the live call, which in a consult is
the answered Consult call, never from the held original.

**The popup lists every other Active call and Connect bridges at once.** There
is no pick-then-confirm step: one row, one Connect, as in the Figma `Bridge
calls` dialog. This also settles the spec's open question of which two calls
Connect joins when there are more than two: the call the popup was opened from
and the row's call.

**The app closes nothing after a bridge.** The two connected calls stay active,
a queue call goes on to its **Post-processing** like any ended call, and the
windows follow the SDK call list. `bridgeCalls` only sends the request and
reports a refusal (`bridgeFailed`).

## Considered options

- *Offer bridging on every Active call.* Rejected: from the held original it
  ended the call, so the icon would lead the agent into losing the client.
- *Hold the live call ourselves before bridging.* Rejected: whether `bridgeTo`
  needs a held call is unknown, and holding it speculatively would hide the very
  behaviour that has to be learned from a live call.

## Consequences

- **Unverified:** whether `bridgeTo` needs one of the calls held, and what a
  bridge from the live call does end to end. To check on a live call with BA
  against the old workspace. If the live call has to be held first, that is a
  change to `bridgeCalls`, not to the popup.
- The icon is gone from a held call, so an agent who wants to bridge from it
  has to resume it first.
- The Call window's top bar has no bridge icon yet; bridging starts from the
  call dock.
