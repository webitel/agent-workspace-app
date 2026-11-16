# 15. A self-assigned call is intercepted, answered by the platform, and its panel searches the contact by the call's number

Date: 2026-11-12

## Status

Accepted. Implemented in [WS-39](https://webitel.atlassian.net/browse/WS-39)
(US_12.03, Calls section, Self-assigned tab).

## Context

The rows of the Calls section's Self-assigned tab are **Self-assigned calls**
(see `CONTEXT.md`): `WaitingMemberCall`s the SDK keeps in
`agent.waitingListCalls` from the socket, each with an `attemptId`, a
`displayName`, a `displayNumber`, a queue and, at times, a linked `contact`.
AC_12.03.02 asks the row's call icon to answer the call, so the agent talks to
the client as on any queue call, sees the call's dock entry, and stays on the
tab. AC_12.03.04 asks the name to open the right panel with the contact card.

The tab's call icon was the shared `phone-call-table-cell`, which dials the
number as an **Outbound attempt**. The tab had no right panel of its own: the
name opened the panel with nothing in it.

`cc-workspaces` took such a call with `agent.interceptAttempt(attemptId)`
(`cc_intercept_attempt`), with a loader on the row, and did nothing after it:
no `answer`, no notification. The call then reaches the agent with
`queue.manual_distribution === 'true'`, which keeps it from raising an
**Offer**, and the platform sends it with `params.autoAnswer`, on which the
SDK answers it by itself (`checkAutoAnswer` → `answerDelay`). Opening a
waiting call there was never built (`openTask` logged "implement me").

`cc-workspaces` put the agent's other calls on hold on every call's `active`
event. This app holds them inside its own actions instead (`answer`, `call`,
taking a call off hold; WS-23), so a call the SDK answers by itself holds
nothing.

## Decision

**The call is intercepted, never dialled by number.** The tab has its own
phone cell, with the same icon, that asks the queue with
`interceptAttempt(attemptId)`. The call stays the queue's and leaves the list
for every agent.

**The app does not answer it.** The platform sends the intercepted call with
`autoAnswer` and the SDK answers it, as for an offline member (ADR-0014). The
call shows in the dock; no Call window opens and no Return target is taken,
since only an accepted Offer takes the agent anywhere.

**The other live calls are put on hold before the request**, as `call()` does
before a manual dial, since the SDK's answer will not hold them. The Offline
tab does the same before `directMember` (ADR-0014), whose call the SDK answers
the same way. The event-wide hold of `cc-workspaces` is not ported.

**Around the request, as on the Offline tab.** One request at a time per row,
with the loader on its button. The list is not reloaded: the SDK drops the
attempt from `waitingListCalls` over the socket. A refused intercept (another
agent was faster, the deadline passed) is only logged with `console.error`.

**The name opens the tab's own panel.** A row with a linked contact selects
it; otherwise the row's number is selected and the panel searches the contacts
by it, as a ringing call's are identified. Several are shown one at a time,
without SELECT (ADR-0013): the call is not the agent's yet, so there is nothing
to link a contact to. Once intercepted, linking is the Call panel's.

## Considered options

- **A manual dial by `displayNumber`, as the cell did.** It places a new call
  to the client while the client's own call keeps waiting in the queue.
- **Answering the intercepted call from the app.** The platform's
  `autoAnswer` already does it, and `cc-workspaces` relied on that.
- **Holding the other calls on every call's `active` event, as
  `cc-workspaces`.** It would also cover an offline member and any other call
  the SDK answers by itself, but it changes when every call holds the others,
  a call answered on a desk phone included.

## Consequences

- If the platform ever sends an intercepted call without `autoAnswer`, it rings
  with no Offer card and no way to answer it from the app.
- A refused intercept, or a refused call to an offline member, leaves the
  agent's other calls on hold.
- Any other call the SDK answers by itself still holds nothing.
