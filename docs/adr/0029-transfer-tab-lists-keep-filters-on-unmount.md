# 29. The transfer tab lists clear their rows on unmount and keep their store's filters

Date: 2026-11-25

## Status

Accepted. Implemented by [WS-95](https://webitel.atlassian.net/browse/WS-95).
Supersedes the "resets it on unmount" part of [ADR-0016](0016-transfer-agents-list.md)
and, through it, of [ADR-0027](0027-transfer-queues-list.md).

## Context

Each tab list of the transfer popup (Agents, Queues, Users) reads a singleton
`createTableStore` from `@webitel/ui-datalist`, and its component mounts every
time the popup opens or the agent switches to its tab (the tabs are not kept
alive). ADR-0016 had the component call the store's `$reset` on unmount, so the
next mount started clean.

In ui-datalist (26.12.10) `$reset` clears the rows, the pagination and the
filters, but leaves `isStoreSetUp` set, deliberately: it was written for lists
nested in a card, whose persistence is restored once per app lifetime. Once the
store is set up, its deep watcher on the filters reloads page 1 on any filter
change, and clearing them is one. A nested list skips that load because it has
no parent left; a registry store like ours does not, so every close of the popup
and every tab switch sent a request for a list no longer shown, and its answer
filled the cleared rows back in. Raised in review of PR #308 and confirmed in
the browser's network log.

## Decision

**On unmount the tab list clears its store's rows and nothing else.** The
filters and the paging stay. The next mount's `setupStore` returns at once, and
its `addFilter` for the search puts a new filter object into the filters' map,
which the deep watcher reacts to whether or not the search text changed: it
moves to page 1 and loads once, as a first mount does. Clearing the rows keeps a
remount from showing the last list while that load runs.

## Considered options

- **Keep `$reset` and change ui-datalist** so a reset does not reload a store
  that is not nested. That is where the surprise lives, but it changes what
  `$reset` does for every registry store in every app, and `isStoreSetUp` is
  kept on purpose. Not needed for this fix; left as a possible ui-datalist
  change.
- **`resetInfiniteScrollTableParamsToDefaults`.** It clears the filters too, so
  it reloads the same way.
- **Delete only the search filter on unmount.** Still a filter change, still a
  request.

## Consequences

- A remount loading at all relies on `addFilter` always replacing the filter
  object. If ui-datalist ever skips a replacement with the same value, a remount
  with an unchanged search loads nothing. The tables' unit tests run on the
  real store with only the API mocked, so a ui-datalist update that changes
  this fails them.
- A request still in flight when the list unmounts lands in the cleared rows.
  The next mount's load replaces it unless it is the slower one, the same
  last-answer-wins gap ADR-0016 leaves open.
