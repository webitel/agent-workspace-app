# 14. A Consult call is derived from the call list and shown as a ringing card

Date: 2026-11-11

## Status

Accepted. Implemented by [WS-95](https://webitel.atlassian.net/browse/WS-95).
Bridging and cancelling a Consult call are not built (see Consequences).

## Context

A **Consult transfer** to an agent holds the original call and places a second
call to the destination (`call.processTransferAgent`). The SDK returns nothing
that identifies that second call, and the app has no UI for it yet: BA has not
decided whether a consult gets a Call window of its own or a "consulting" panel
inside the original's window.

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
end a consult without settling the open Call-window question.

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

- **Unverified:** the backend sending `parent_id` on a live Consult call. The SDK
  reads it into `Call.parentId`, but no live call has been seen. If it does not,
  the Consult call has to be remembered in the store, a workaround to isolate
  and comment.
- `linkAttemptsToCalls` can adopt a ringing Consult call for a numpad attempt
  dialled at the same moment. Accepted risk, like the desk-phone one.
- Bridging (`call.bridgeTo`) and cancelling the consult are not built: the agent
  ends the consult with Hangup and resumes the original by hand until BA decides
  where a consult lives (AC_14.02.07). Whatever they decide replaces the ringing
  card, not the derivation.
