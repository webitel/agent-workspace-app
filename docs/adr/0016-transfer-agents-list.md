# 16. The transfer popup's agents list is a ui-datalist table store, searched on the debounced event

Date: 2026-11-10

## Status

Accepted. Implemented by [WS-95](https://webitel.atlassian.net/browse/WS-95).

## Context

The transfer popup has one search field above four tabs (Agents, Queues, Users,
Dialplans). Each tab lists a different kind of destination, from a different
endpoint, and the agent picks one row to consult or blind-transfer to. The
Agents tab is the first to be built from real data.

Every table in the app already reads its list through `createTableStore` from
`@webitel/ui-datalist`. The popup differs from them in two ways: it is opened
and closed many times over one page, and its search is not a page-level
concern, so it must not show up in the route query of the page beneath.

## Decision

**The agents list is a `createTableStore`**, like the other tables, with
`disablePersistence` so its search stays out of the route. Its `apiModule` is
a module of its own (`api/transferAgentsApiModule.ts`) and the store only wires
it to the headers, which keeps the API call apart from the store setup.

**The api module returns rows, not api models.** `getList` runs the response
through `applyTransform`, mapping each `EngineAgent` onto the module's own
`TransferAgentRow`, so the store's `dataList` is what the table draws and no
component adapts SDK objects. An agent without an `id` is left out: the
generated model marks `id` optional, and a row is selected and transferred to
by it.

**The agent themself is not listed**, by `notUserId`, which takes user ids. Its
status column reads two api fields (the agent status and the presence, for
DnD), so `user_presence_status` is requested on top of the header fields.

**The popup owns the search; each tab body is its own table.** The popup keeps
`searchInput` (the field's text) apart from `searchQuery` (what the list
searches by) and moves the second on the search bar's debounced `search` event,
not on every `input`. A tab body takes `search` as a prop and owns its list and
its selected row (`v-model:selected-row-id`), so a tab is added by adding a
component and a `TRANSFER_MODES_BY_TAB` entry, not by branching in the popup.

**The table sets the store up on mount and resets it on unmount.** The store is
a singleton and the popup opens many times. Adding the `search` filter after
`setupStore` is the filter change the store's watcher reloads page 1 on, so a
mount loads once; `initialize` would load as well and race that watcher on a
remount.

**A second click on the selected row clears it**, on every tab. AC_13.07.10
describes it for Users only; behaving alike across tabs was chosen over a rule
the agent has to learn per tab.

## Considered options

- **A hand-written list** (own state, own paging) as the first Agents tab, with
  the table store left for later. Faster to write, but it would be the one table
  in the app not built from the store, and the other tabs would copy it.
  Rejected.
- **One table for every tab**, switching its api module. The tabs differ in
  columns, row cells and which transfer a row allows, so the table would branch
  on the tab. Rejected for a component per tab.
- **Request on every `input`.** Sends a request per character. Rejected for the
  debounced `search` event.

## Consequences

- The store applies the last answer to arrive, not the answer to the last
  request, so a slow answer to an older search can replace a newer one. The
  debounce makes it rare, it does not remove it. The fix belongs in
  `@webitel/ui-datalist`, not in this module, and is left open.
- The channel states of AC_13.07.04 (Busy, Offering, Waiting and the rest) are
  not shown yet: how they map to the status indicators is not settled, so a
  status the list does not know is left absent rather than shown as another one
  (ADR-0001).
- Every further tab inherits the same shape (an api module, a table store, a
  body component that takes `search`).
