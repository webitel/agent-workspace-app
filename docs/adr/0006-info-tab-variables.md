# 6. The Info tab merges the task's and the thread's variables, and shows duplicates

Date: 2026-10-01

## Status

Accepted. Implemented alongside
[WS-50](https://webitel.atlassian.net/browse/WS-50).

## Context

AC_03.02.06 describes the Info tab as "the variables that were passed", as one
Key/Value table. A chat keeps variables in two places that this app reads from
different layers:

- the call-center **task** (`task.variables`) — attached when the queue
  distributed the chat. It is on the SDK `Task` the window already holds,
  synchronous and reactive.
- the chat **thread** (`GET /v1/threads/{id}/variables`, through chat-web-sdk) —
  set by bots and flows over the life of the chat, as `{ value, setAt, setBy }`
  entries. It is REST only, with no socket event to say it changed.

The spec does not say which is meant, and the two are not the same set.

## Decision

**Both, in one table, task rows first.** Neither source is a subset of the other.

**A key present in both appears twice.** Neither source is more authoritative —
the task's is what the queue knew at distribution, the thread's is what happened
since — and picking a winner would hide a value the agent may need. Rows carry a
source-qualified id (`task:Language`, `thread:Language`) so the table can key
them; the cell shows only the key. Sorting is stable, so a duplicated key keeps
its task-first order in both directions.

**Thread variables are re-read every time the tab is returned to.** With no event
to subscribe to, the only way the table is current when the agent looks at it is
to ask then. The window keeps panels alive across tab switches, so this runs on
activation, not on mount. State lives in the chat's session store (variables, a
loading flag, an error), and only the newest request may write, because tab
switches can outpace the server.

**A failed read keeps what was shown.** The error is raised above the table with
a retry; the rows stay.

**403 and 404 are not failures.** A 404 means the thread has none. A 403 means
the agent's role cannot read them, which no retry fixes, and an error screen on
every chat would be worse than the task's variables alone. Both fall back to "no
thread variables"; the 403 is logged so it can be found.

## Alternatives considered

**Task variables only.** Simplest, nothing to load. It drops everything a bot or
flow set on the thread, which is much of what an agent opening the tab wants to
see.

**Thread wins on a collision** (or task wins). One row per key reads cleaner, but
the choice is arbitrary and silently hides a value.

**Fetch once, with the history.** One request, but a long chat's tab goes stale
with nothing to tell the agent so.

## Consequences

Whether agent roles may read thread variables is not verified against a live
instance. If they cannot, the tab still works (task variables only) but never
shows thread ones, and nothing but a console warning says why. That is a backend
or role question, not one for this app.

The thread read costs one request per visit to the tab.

The three tabs after Post-processing (Interaction, Contact, Iframe) are in the
strip per DES-730 but disabled: `WtTabs` has no disabled state, so the window
renders them through a slot and ignores selecting them. Enabling one is a flag in
the window's tab list.
