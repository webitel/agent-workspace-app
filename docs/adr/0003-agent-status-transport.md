# 3. Agent status is written over REST and read over the websocket

Date: 2026-09-21

## Status

Accepted. Implemented alongside
[WS-3](https://webitel.atlassian.net/browse/WS-3).

## Context

An agent needs to move between Online, Pause and Offline from the header. Both
transports can carry the change: `ui-sdk` ships `wt-cc-agent-status-select`,
which renders the dropdown, loads pause causes and activity types, raises the
popups for both, and writes the new status with
`PATCH /call_center/agents/{id}/status`; the websocket session separately
offers `online()` / `pause()` / `offline()`, already wrapped in this app's
agent store.

The display side is not symmetrical with the write side. The status shown comes
off the websocket session — `agent.status` and `agent.lastStatusChange` on a
`reactive()` `Agent` that the SDK client mutates when an `agent_status` frame
arrives. That is true whichever way the change was written.

## Decision

**Mount the SDK's component; the write goes over REST.** The header wraps
`wt-cc-agent-status-select` in a thin component that supplies `agentId`,
`status`, a ticking `statusDuration` and `disabled`. The popups, the decision
of when to ask, and the error handling are the SDK's.

**Read the status off the websocket session, and subscribe for it.** The
session reply carries the status once. Keeping it current requires
`cc_agent_subscribe_status`; without that subscription the server pushes no
`agent_status` frames, the SDK never calls `Agent.setStatus`, and the status
freezes at whatever the session opened with — including after this app's own
writes, since the REST call and the websocket ack both return without echoing
the new status. `initializeAgent` sends that subscription.

## Alternatives considered

**Writing over the websocket instead**, using the store's existing
`online()` / `pause()` / `offline()` wrappers, was built first and reversed.
The appeal was a single channel for both directions. It cost more than it
saved:

- `wt-cc-agent-status-select` performs the REST patch itself and takes no
  injectable write, so using the websocket meant reimplementing its
  orchestration here and exporting its popups from `_internals` — two copies of
  one flow, free to drift.
- `cc_agent_pause` carries a single opaque `payload` and declares no shape, so
  the cause and the agent's comment had to be mapped onto guessed field names.
  The REST body declares `payload` and `status_comment` outright.
- `pause()` resolves with a `PauseNotAllowedError` rather than throwing it,
  which is easy to miss and had to be handled by hand.

Making the SDK component's write injectable would have kept one component and
one channel, at the price of an SDK API change and a coordinated release. Worth
revisiting if a second app ever needs the websocket write.

## Consequences

One implementation of the status flow, shared with `cc-workspaces`, upgraded by
bumping a dependency. This app owns only the wrapper: the duration clock and
the disabled rule.

The two directions differ, so the UI does not move until the server says so. A
status change is not reflected optimistically; it appears when the
`agent_status` frame lands. That is the desired behaviour — the header shows
what the platform believes, not what was requested — but it makes the
subscription load-bearing rather than an optimisation. If the status ever
appears frozen again, check for `cc_agent_subscribe_status` on the wire first.

`Agent.stateDuration` exists but is a plain getter, so it never re-renders; the
elapsed time comes from a ticking clock in the wrapper instead.
