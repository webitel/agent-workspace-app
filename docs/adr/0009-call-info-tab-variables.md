# 8. A call's Info tab shows the call's variables only, not merged like a chat's

Date: 2026-10-22

## Status

Accepted. To be implemented with
[WS-91](https://webitel.atlassian.net/browse/WS-91).

## Context

AC_13.02.01 describes the Call window's Info tab as "the variables that were
passed in the call from the flow", as one Key/Value table — the same wording
as the chat's Info tab, which ADR-0006 resolved by merging two sources.

A call also offers two:

- the **call** (`call.variables`) — the payload the flow exports onto the call.
  Set when the call rings and refreshed on bridge, reactive, and present on every
  call, a manual dial or an internal call included.
- the call-center **task** (`task.variables`) — the queue's distribution
  variables, with `cc_*` stripped by the SDK. Only queue calls have a task.

Nothing on the call side changes behind REST the way a chat thread's variables
do, so the reason ADR-0006 re-reads on every tab visit does not arise.

## Decision

**The call's own variables, alone.** The tab renders `call.variables` through
the shared variables table, with nothing to load, retry or fail.

## Alternatives considered

**Merge in the task's variables, as ADR-0006 does for chats.** Cheap — the rows
are already source-qualified — but for a queue call the two sets largely
overlap, so most keys would show twice, and the spec's "passed from the flow"
names the call's payload. It would also give queue calls and other calls
different tables for no reason the agent can see.

`cc-workspaces` showed the call object's variables in its call info section, so
this is also what agents are used to.

## Consequences

A variable the queue distributes but the flow never exports onto the call is
not shown. If agents need one, the fix is to export it in the flow, or to revisit
this decision and merge — the table already supports several sources.

Chats and calls differ on purpose: a reader comparing the two Info tabs should
land here and on ADR-0006, not "fix" one to match the other.
