# 25. A call the agent handed over is a hung-up call, not a state of its own

Date: 2026-11-18

## Status

Accepted. Implemented by [WS-95](https://webitel.atlassian.net/browse/WS-95).

## Context

cc-workspaces gave a transferred call no status of its own: neither open nor
closed. Its transfer button stayed live through the whole post-processing,
although the call was already given away, and that caused bugs. BA fixed the
rule for the new workspace in WTEL-8983 (comment of 2026-02-24): for the agent
who transferred, the transfer ends the call. The centre shows the hangup state,
the call preview stays on the left, and everything goes when post-processing
ends. Of the three options in the ticket (hide the button, disable it, show a
message) BA picked the hangup state.

Whether the new app gets that for free depended on the SDK marking the call
hung up after a blind transfer. Checked on a live instance on 2026-11-18, for a
blind transfer to a queue and to a number, on a queue call that has a task and
`reporting: "true"`: about 0.5 s after the request is accepted the call goes
from `state: "active"` to `state: "hangup"`, `hangupAt` is set and
`allowTransfer` becomes `false`. The call stays in the list with its task for
about 10 s more, then leaves it and the task store is disposed. The backend
developer confirmed `hangupAt` is meant to be set.

## Decision

**No "transferred" status is added.** A call the agent handed over is an
ordinary hung-up call. `isActiveCall` (`answeredAt > 0 && !hangupAt`) stops
holding for it, so `canTransferCall`, the top bar, the dock and the Call window
treat it as they treat any hangup, with no code of its own. The rule stays
derived from the SDK call (ADR-0017), with no second source of truth beside the
SDK or the thread.

A regression test pins the `canTransferCall` side of it.

## Considered options

- **A stored "handed over" flag or status.** Rejected: a second source of truth
  that has to be kept in step with the SDK, and the SDK already says it.
- **cc-workspaces' behaviour** (button live, "already transferred" message).
  Rejected by BA in WTEL-8983.

## Consequences

- The Call window of a transferred call with a task stays through
  post-processing, as after a hangup, and closes by the Return target rule when
  the SDK drops the call.
- Observed only on one queue call with a task and `reporting: "true"`. The
  probe did not log whether that call had a processing form, so what happens to
  a form after the hand-over is open, as is how the 10 s relate to the queue's
  post-processing deadline.
- A consult transfer is not covered: its original call is held, not hung up,
  until the consult is bridged.
- The backend may route a blind transfer to a queue to any free agent of that
  queue, not to the one the sender had in mind.
