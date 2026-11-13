# 15. The transfer popup's queues list pages through a composable, and its selected row is painted by wt-table

Date: 2026-11-11

## Status

Accepted. Implemented by [WS-95](https://webitel.atlassian.net/browse/WS-95).
The first decision is a known deviation from ADR-0013 and is meant to be
reversed.

## Context

The Queues tab sits beside the Agents tab in the transfer popup and has the
same shape: a body component that takes `search`, owns its list and its
selected row. ADR-0013 builds the Agents list on a `createTableStore`. The
Queues tab was written while that work was still in review, so it could not
copy it.

The tab also had to show which row is selected. The Agents table does it with
its own `:deep` rule on a `--wt-ws-table-colors-row-selected-background` token.
No published `@webitel/styleguide` defines that token (26.12.8 is the latest),
so the rule produced an invalid `background` and nothing was ever highlighted.

## Decision

**The queues list is a composable, not a table store.** `useTransferQueueList`
pages `features/queues/api/searchQueues.ts` (20 per page, inbound queues only,
search by name) and keeps its own `rows`, `isLoading` and `hasNextPage`. Only
the answer to the latest request is applied, so a slow answer to an older
search cannot replace a newer one (the table store does not guarantee this, see
ADR-0013). A failed page stops further paging instead of retrying on every
scroll; the API layer has already raised the error notification.

**The selected row is passed to `wt-table` as `active-row`**
(`@webitel/ui-sdk` 26.12.26 and later). The library marks it `row-active` and
paints it from its own theme, so the table carries no colour rule and needs no
workspace token. The table computes the row from its `rows` and `selectedRowId`.

## Considered options

- **A `createTableStore` for queues now**, as for agents. It is where the tab
  should end up, but it was not available when the tab was written, and moving
  it in the same change would have mixed a rewrite into a feature. Deferred, not
  rejected.
- **The Agents table's own `:deep` rule** for the highlight. Rejected: it
  depends on a token that does not exist.
- **A hard-coded colour fallback** (`var(--token, #FBEFD0)`). Rejected: a
  literal colour in a component, no dark theme, and it keeps a dependency on a
  token nobody publishes.

## Consequences

- Two tabs list in two ways until the queues list moves onto the table store.
  A change to paging or search has to be made in both places meanwhile.
  `useTransferQueueList` carries a TODO pointing here.
- The latest-request guard disappears with the composable, but the store does
  not have it: moving to the store brings back the race ADR-0013 leaves open
  for agents.
- The list does not leave out a disabled queue: the list API has no `enabled`
  filter.
- The Agents table was moved to `active-row` in the same branch and drops its
  own rule, so both tabs highlight the selected row the same way.
