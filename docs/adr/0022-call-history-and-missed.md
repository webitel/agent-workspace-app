# 19. Call history and Missed read one API module through `getListPost`; the period defaults to all time, worked out per request; History does not sort by Name

Date: 2026-11-13

## Status

Accepted, recorded after the fact. Implemented in US_19.01 (History → Calls,
[WS-29](https://webitel.atlassian.net/browse/WS-29)) and US_12.01 (Calls →
Missed, [WS-33](https://webitel.atlassian.net/browse/WS-33)).

## Context

The History page's Calls tab lists the agent's calls; the Calls section's
Missed tab lists the ones they missed. Both come from the call history
(`CallHistoryAPI` in `@webitel/api-services`), filtered to the agent as owner;
Missed adds `missed: true`.

Things the endpoint and the table ask of the request:

- The backend rejects a history request without a `created_at` range
  (WTEL-6386). `from: 0` means all time.
- Variable columns (AC_19.01.08–11) show the call's `variables` by their own
  keys. The client's `snakeToCamel` would recase those keys; only
  `getListPost` takes `doNotConvertKeys`.
- Some columns are built from several fields. Name shows the call's
  `contact.name`, else the other party's name, else the other party's number,
  chosen by direction; Phone picks the other party's number the same way.
- A history row is often the agent's leg of a call; the call's variables,
  forms and transcripts belong to the main call (`parentId`, else `id`).

## Decision

**One API module serves both tables.** `callsHistoryApiModule` lives in
`features/calls/api`, not in either page. Each page's store wraps its
`getList` and adds what is the page's: `ownerId` from the user store (API
modules do not use stores, see `CONTEXT.md`), and for Missed `missed: true`.

**It reads through `getListPost`** with `doNotConvertKeys: ['variables']`.
Body keys are passed in camelCase and the client converts them, except
`variables`.

**Header fields that are not backend fields are expanded.** `name` and
`phone` are virtual: `VIRTUAL_FIELDS` turns each into the API fields its cell
needs. `files` and `parent_id` are always asked for, for the row actions.

**With no date filter set, the period is all time:** from `0` to the end of
today, worked out on every request. Nothing is seeded into the filter. History
offers a Date filter on its Date & Time column, whose relative values are also
resolved per request; Missed has none, so it always covers all time, as its
spec says.

**Search is `q` with a trailing wildcard** (`starToSearch`), as the backend
matches exactly otherwise.

**History's Name column is not sorted.** No backend field orders rows the way
the column reads. Date & Time and Duration sort on the server.

**Call info is read on its own, for the main call.** The info popup asks
`getListPost` for the one call `getMainCallId` gives, with `from: 0`, and
keeps `variables` and `form_fields` unconverted.

## Considered options

- **`getList` (GET), as first built.** It cannot leave `variables` unconverted,
  so variable columns would not match their keys.
- **`AgentCallsAPI.getList` from the library**, asked about in review. It has
  no `doNotConvertKeys`, pre-formats fields in its own list handler, and skips
  parent legs by default.
- **A module per page.** The two tables differ only in `missed`; two modules
  would repeat the field expansion, the period and the search.
- **A default period as absolute dates in the filter** ("from the 1st of last
  month", then "today", both tried with the BA). A saved `to` stops at the day
  the tab was opened, so a tab left open overnight misses the new day's calls.
  The final default matches `cc-workspaces`: everything up to the end of today.
- **Sorting Name by `destination`**, the backend's suggestion. `destination`
  is the dialled number: the client's for an outbound call, the internal line
  for an inbound one. Sorted by it, the column would not be in the order it
  reads.

## Consequences

- With no filter, the first request covers the agent's whole history; only the
  page size bounds it.
- Sorting History by Name needs a field from the backend that holds what the
  column shows. Until then it stays off; asking for it is a backend question,
  not a frontend one.
- Missed's Name header is declared sortable, so sorting it asks the backend to
  sort by `name`, the virtual field.
- A cell that needs another API field has to add it to `VIRTUAL_FIELDS`, or
  the field is not requested and the cell renders empty.
