# 24. The transfer popup's queues list is a table store, and its selected row is painted by wt-table

Date: 2026-11-11

## Status

Accepted. Implemented by [WS-95](https://webitel.atlassian.net/browse/WS-95).

## Context

The Queues tab sits beside the Agents tab in the transfer popup and has the
same shape: a body component that takes `search`, owns its list and its
selected row. ADR-0016 builds the Agents list on a `createTableStore`.

The tab also had to show which row is selected. The Agents table did it with
its own `:deep` rule on a `--wt-ws-table-colors-row-selected-background` token.
No published `@webitel/styleguide` defines that token (26.12.8 is the latest),
so the rule produced an invalid `background` and nothing was ever highlighted.

## Decision

**The queues list is a `createTableStore`, like the agents list.**
`transferQueuesApiModule` wraps `QueuesAPI.getList` (inbound queues only,
`queueType: INBOUND_QUEUE`) and maps each queue onto a `TransferQueueRow`; the
columns and the requested fields come from `transferQueuesHeaders`. The table
component loads, searches and resets the store exactly as the Agents table does
(ADR-0016), so a change to paging or search is made in one way for both tabs.

An earlier version of this branch paged through a hand-written composable that
applied only the answer to the latest request. It was removed in review: it
gave two tabs two ways of listing, and the race it closed is the one ADR-0016
leaves open for agents, to be fixed once in `ui-datalist` rather than per tab.

**The selected row is passed to `wt-table` as `active-row`**
(`@webitel/ui-sdk` 26.12.26 and later). The library marks it `row-active` and
paints it from its own theme, so the table carries no colour rule and needs no
workspace token. The table computes the row from its `dataList` and
`selectedRowId`.

## Considered options

- **A hand-written composable for queues.** Rejected in review: every other tab
  would have to repeat the same API module + table store + component shape, and
  it fixes a race for one tab only.
- **The Agents table's own `:deep` rule** for the highlight. Rejected: it
  depends on a token that does not exist.
- **A hard-coded colour fallback** (`var(--token, #FBEFD0)`). Rejected: a
  literal colour in a component, no dark theme, and it keeps a dependency on a
  token nobody publishes.

## Consequences

- A slow answer to an older search can replace a newer one on the Queues tab,
  as on the Agents tab (ADR-0016).
- The list does not leave out a disabled queue: the list API has no `enabled`
  filter.
- The Agents table was moved to `active-row` in the same branch and drops its
  own rule, so both tabs highlight the selected row the same way.
