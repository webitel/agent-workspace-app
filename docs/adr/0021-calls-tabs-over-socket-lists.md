# 18. The Offline and Self-assigned tabs are datalist tables over socket lists: Offline is read a page at a time and not polled, Self-assigned shows the SDK's own live array

Date: 2026-11-13

## Status

Accepted, recorded after the fact. Implemented in
[WS-34](https://webitel.atlassian.net/browse/WS-34) (US_12.02, Offline) and
[WS-39](https://webitel.atlassian.net/browse/WS-39) (US_12.03, Self-assigned).
What their rows do (calling, intercepting, the panel) is ADR-0014 and
ADR-0015; this record covers how the lists are read.

## Context

The Calls section's tables are `@webitel/ui-datalist` table stores, like
History and Missed: headers, sort, search, column resize and reorder, and
paging on scroll. Missed reads REST.

Neither of the other two lists has a REST endpoint. Both come over the agent's
websocket session (webitel-sdk), and in two different shapes:

- **Offline members** are a request and a reply: `agent.offlineMembers(q, page,
  perPage, sort)` (`cc_fetch_offline_members`). The backend pages, sorts and
  searches. It matches `q` exactly. The SDK declares no type for a member.
  Nothing tells the app when the list changes.
- **Self-assigned calls** are pushed. The SDK keeps them in
  `agent.waitingListCalls` and pages, sorts and searches them itself:
  `setWaitingCallsQuery({ q, size, sort })` sets the query,
  `loadMoreWaitingCalls()` shows the next page, `hasMoreWaitingCalls` says
  whether there is one. It rewrites `waitingListCalls` in place (`splice`),
  never replacing the array.

`cc-workspaces` re-read the offline members every 15 seconds.

## Decision

**Both tabs are datalist table stores**, so they look and behave like the
other tables: the same headers, sorting, search, column persistence and
action panel. Each store gets an `apiModule` whose `getList` adapts the
store's params to the socket call.

**Offline: an adapter, read on demand, never polled.**
`offlineMembersApiModule` maps `search`, `page`, `size` and `sort` onto
`agent.offlineMembers`, adds the `*` wildcard (`starToSearch`) because the
backend matches `q` exactly, and recases the reply. The member's shape is
described in the app (`OfflineMember`) from the real reply. The table appends
pages on scroll. The list is read when the tab opens, on scroll, on a change
of sort or search, and after the agent calls a member (ADR-0014), and at no
other time.

**Self-assigned: the store holds the SDK's array itself.** `getList` passes
the store's search, size and sort to `setWaitingCallsQuery` and returns
`agent.waitingListCalls`, the very array, not a copy. The SDK keeps that array
current from the socket, so the table follows every push with no reload.
Next pages come from `loadMoreWaitingCalls()`, not from the store's
`appendToDataList`. The sortable columns' `field`s are the SDK's sort fields,
since the SDK does the sorting. The table loads the list again when the agent
session appears or changes.

**Wait time is not a running clock.** It shows `wait` as the SDK holds it.

## Considered options

- **Re-reading the offline members on a timer**, as `cc-workspaces` did every
  15 seconds. It was built (every loaded page re-read in one request, keeping
  the scroll) and removed in review: no other table in the central area
  refreshes on a timer, and a table that appends pages would have to re-read
  all of them each time to stay correct.
- **Copying `waitingListCalls` into the store**, as a REST reply would be.
  The copy stops following the socket: the SDK splices the original, and the
  store's copy never hears of it.
- **A separate API module for Self-assigned**, as Offline has. Removed in
  review: there is nothing to adapt beyond passing the query on, so the
  `getList` lives in the store.

## Consequences

- The Offline list can be out of date: a member another agent called stays on
  screen until the list is read again. If the queue refuses a call to such a
  member, ADR-0014 only logs it.
- Self-assigned rows change under the agent while they look at them, as calls
  are taken or arrive.
- The Self-assigned store's `next` is not used: the table asks the SDK
  (`hasMoreWaitingCalls`) whether there is more.
- Anything that copies or maps `dataList` for Self-assigned (a transform, a
  spread) silently freezes the table. Map in the template or in cells instead.
