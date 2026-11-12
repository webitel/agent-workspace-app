# 14. A Consult call is derived from the call list and shown as a ringing card

Date: 2026-11-11

## Status

Accepted. Implemented by [WS-95](https://webitel.atlassian.net/browse/WS-95).
Bridging and cancelling a Consult call are not built (see Consequences).

## Context

A **Consult transfer** to an agent holds the original call and places a second
call to the destination (`call.processTransferAgent`). The SDK returns nothing
that identifies that second call. BA agreed that the Consult call shows as a
second call card beside the original. Bridging is not specific to a consult:
AC_14.02.07 shows a bridge icon whenever the agent has more than one Active call,
and it opens a modal listing them with Connect and Cancel. The original is held
and the answered consult is live, so together they are two Active calls.

## Decision

**The Consult call is not stored.** It is the call in the SDK list that is
outbound, not yet answered or hung up, and whose `parentId` is the id of another
listed call (`isRingingConsultCall`, `callsStore.ringingConsultCalls`). The
transfer popup keeps no `consultCallId`, and `calls` stays derived from the SDK
feed like `activeCalls` and `incomingOffers`. The parent has to be listed, so a
leg the platform split off with a `parentId` is not taken for a consult.

**While it rings it is an `outbound-call-card` in the dock lane**, with Mute
and Hangup only. It is neither an Active call nor an outbound attempt (only the
numpad starts attempts). Once answered it is an Active call with its own tray
entry, and the card goes. This is the smallest view that lets the agent see and
end a consult. BA agreed on the card itself. After the answer nothing consult-
specific is needed: it is an Active call like any other.

**The original is held by the app, not the SDK.** `processTransferAgent` only
sends `call_to_queue`. `consultTransferToAgent` holds the original first, unless
it is already held. A hold that fails stops the consult (`holdToggleFailed`).
A refused consult raises `transferFailed` and leaves the original on hold: the
agent resumes it by hand, since nothing here knows the consult never started.

**The popup closes on a successful consult**, unlike a blind transfer, because
the original stays in the call list and nothing else would close it.

## Considered options

- *Remember the Consult call in the store when the consult starts.* Rejected: it
  needs the id the SDK does not return, so the call would be matched to the
  request by guessing, as `linkAttemptsToCalls` does for dialled calls. It would
  also be a second source of truth beside the call list.
- *Reuse the outbound attempt for it.* Rejected: attempts are the numpad's
  concept (the number as typed, a `Call` that outlives `Destroy`) and a consult
  has neither.

## Consequences

- **Verified on a live instance (2026-11-12):** the backend sends `parent_id` on
  the Consult call. It arrived with the `ringing` event, equal to the id of the
  original, which was listed and on hold. `isRingingConsultCall` was true until
  the destination answered, so no store workaround is needed.
- **A consult to an agent who cannot take the call fails silently.** With the
  destination agent on DnD or Offline (both tried live, 2026-11-12) the backend
  connects the leg and drops it about 140 ms later: `answeredAt` and `hangupAt` are both set, `processTransferAgent` resolves
  without an error, and so no `transferFailed` is raised. The card goes, the
  original stays on hold, and the agent is told nothing. Such a call cannot be
  told from a real one that ended fast by its fields. Not handled: the fix (blocking Consult for
  an unavailable agent in the popup, or a message and resuming the original) is
  a product decision.
- `linkAttemptsToCalls` can adopt a ringing Consult call for a numpad attempt
  dialled at the same moment. Accepted risk, like the desk-phone one.
- Bridging (`call.bridgeTo`) is not built, so there is no bridge icon yet. It is
  AC_14.02.07, a feature for any two Active calls, and it needs no consult-
  specific code: the derivation stays. Until it exists the agent ends the consult
  with Hangup and resumes the original by hand. The spec does not say which two
  calls Connect joins when there are more than two Active calls.
- The spec has no "cancel consult" either: the modal's Cancel only closes it. The
  agent abandons a consult with Hangup.
