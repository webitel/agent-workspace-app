# 3. Agent status writes go over the websocket

Date: 2026-09-19

## Status

Accepted. Implemented alongside
[WS-3](https://webitel.atlassian.net/browse/WS-3).

## Context

An agent needs to move between Online, Pause and Offline from the header. The
platform already offers a finished answer: `ui-sdk` ships
`wt-cc-agent-status-select`, a component that renders the dropdown, loads pause
causes and activity types, raises the popups for both, and writes the new status
itself with `PATCH /agents/{id}/status`. `cc-workspaces` mounts it and is done.

This app cannot mount it without also adopting its write path. The websocket
session is already the source of truth for agent status here: `agent.status` and
`agent.lastStatusChange` come off a `reactive()` `Agent` instance that the
`webitel-sdk` client mutates on every `agent_status` frame, and
`features/agent/store/agent.ts` already wrapped `online()` / `pause()` /
`offline()` — though nothing called them.

So the choice was not "build or reuse" but "which transport owns a status
change". Two writers for one piece of state is the thing worth avoiding: a REST
PATCH and a websocket command that reach the same server state by different
routes, with different error shapes and different payload fields.

## Decision

**The websocket owns the write.** The header component calls
`useAgentStore`, which calls the session's `online()` / `pause()` / `offline()`.
No REST status PATCH.

**The SDK's popups are reused, the SDK's wrapper is not.** The pause-cause and
activity-type popups are presentational — options in, a choice out — and they
already render the agreed design, down to the per-cause duration/limit and the
overflow case. They were promoted from `_internals` to a public export of
`ui-sdk`'s `AgentStatusSelect` module rather than copied here or deep-imported.
The orchestration the SDK wrapper performs — load causes, decide whether to ask,
write — is what our component reimplements, because that is the part welded to
REST.

**The pause cause rides in the payload as `status_payload`, with the agent's
note as `status_comment`.** `cc_agent_pause` carries a single opaque `payload`
and declares no shape; these names mirror the fields the server echoes back in
its `AgentStatusEvent`.

## Consequences

The app has one way to change agent status, and the status it displays comes
from the same channel that confirms the change.

The cost is a component we own that must keep pace with the SDK's. If pause
causes grow a field, or the online flow gains a step, `cc-workspaces` gets it by
upgrading a dependency and this app does not.

Two failure modes differ from REST and are easy to miss:

- `pause()` **resolves** with a `PauseNotAllowedError` rather than throwing it,
  so the result has to be inspected, not caught.
- `online()` throws `app.agent.login.app_err` when the agent no longer exists;
  that is a removed agent, not a transport failure, and it disables the control
  rather than surfacing an error.

The pause payload's field names are unverified against the backend at the time
of writing. They are mapped in exactly one place in the store, so correcting
them is a one-line change.
