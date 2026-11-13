# 16. The right panel shows what the route resolves to; a row picked in a table is held in a selection store while the panel is open

Date: 2026-11-13

## Status

Accepted, recorded after the fact. Built in
[WS-74](https://webitel.atlassian.net/browse/WS-74) (US_07.02) and
[WS-65](https://webitel.atlassian.net/browse/WS-65) (US_07.08), extended in
[WS-125](https://webitel.atlassian.net/browse/WS-125) (US_07.07),
[WS-72](https://webitel.atlassian.net/browse/WS-72) (US_07.01) and
[WS-93](https://webitel.atlassian.net/browse/WS-93) (US_13.06). Later panels
plug into it the same way: [WS-33](https://webitel.atlassian.net/browse/WS-33)
(Missed), [WS-34](https://webitel.atlassian.net/browse/WS-34) (Offline),
[WS-39](https://webitel.atlassian.net/browse/WS-39) (Self-assigned) and
[WS-30](https://webitel.atlassian.net/browse/WS-30) (Users).
ADR-0013, ADR-0014 and ADR-0015 build on it.

## Context

Epic Е7 puts a **Right panel** beside the central area (see `CONTEXT.md`). The
product rules for it:

- it shows whatever is open in the central area: on a table page, the row the
  agent picked; on the Call window, that call;
- with several communications at once, it shows the one whose window is open;
- it shows CRM contacts only. A row without one shows an **Unknown contact**,
  not a member's or a schema's name.

One page's panel has several screens: nothing picked (an empty state, with
CREATE on Contacts), a contact card, an unknown contact, a create form, the
contacts found by a number. Its section title follows the screen ("Contacts",
"Profile", "Add contacts"). The design has no close button in the panel: the
agent opens and closes it with a toggle icon beside the page's tabs.

A table and the panel sit in different parts of the tree. The table is in the
central area; the panel is rendered by `the-workspace-sidebar` next to it. A
click on a row has to reach the panel through something both can see.

## Decision

**What the panel shows is derived from the route.** `useSidebarContent` maps a
route name to a resolver that returns `{ component, props }`, or `null` when
there is nothing to show. The shell renders what it gets and knows no page. A
route with no entry gives an empty panel; a new page is one entry.

**A resolver hands its container the data.** The Call window's resolver finds
the call by the route's `callId` and passes it as a prop. With the call gone it
returns `null`, and the panel renders nothing rather than an empty padded box.
Containers do not read the route or look their data up themselves.

**Whether the panel is open and what is picked are two stores.**
`workspace-sidebar` holds only whether the panel is open. `sidebar-selection`
holds what the agent picked in a table, as one of:

- `Contact`, with an id: the row has a linked contact;
- `Unknown`: the row has none (History);
- `PhoneNumber`: the row carries only a number, and the panel searches the
  contacts by it (Missed, Offline, and Self-assigned without a linked contact;
  ADR-0014, ADR-0015).

It is a union rather than an id plus flags, so a selection cannot be two things
at once, and a container switches on its `type`. `selectContactOrUnknown` is
the one entry for rows that may or may not carry a contact. Every `select*`
opens the panel.

**The Call window does not use the selection.** Its panel follows the call it
is given; the selection serves table pages only.

**A selection lives while the panel is open and the page stays.** Closing the
panel clears it (`workspace-sidebar.close()`), so the next open starts from the
empty state. A change of route name clears it and closes the panel
(`useSidebarRouteReset`). A query-only change (filters, paging, sort) keeps
both.

**Each page has its own container**, `modules/<page>/the-<page>-panel.vue`. It
picks the screen from the selection, or from its props, and renders its own
section header, because the title follows the screen. The screens are shared
components under `components/contact/` (`contact-card`,
`contact-card-unknown`, `contact-panel-empty`, `contact-identification`,
`contact-create-form`): props in, events out, no store and no router.

**The panel never opens by itself.** The agent opens it with the toggle
(`sidebar-toggle-btn`, in the tables' action panel and on the Call window) or by
clicking a row's name. Answering or opening a call does not open it.

## Considered options

- **Pages push the panel's content into a store.** Each page would set what the
  panel shows and clear it on the way out. Every way of leaving a page would have
  to clear it, and a missed one leaves another page's content on screen: the
  failure ADR-0001 avoided for offers by deriving instead of pushing.
- **The picked contact as a query parameter** (`?contactId=`), read by the
  resolver. It follows "derived from the route" all the way and survives a
  reload. Not taken: a selection is not just an id, as `Unknown` and
  `PhoneNumber` would each need keys of their own; the panel closes on every
  page change, so the URL would keep nothing past the page except across a
  reload; and the resolvers' `props` would have to become a function of the
  query.
- **The section header and a close button in the shell** (the first version).
  The title changes within one page, which the shell cannot see, and the design
  has no close button.

## Consequences

- A reload drops the selection and leaves the panel closed: neither store is
  persisted.
- The two stores depend on each other (`close()` clears the selection, every
  `select*` opens the panel). `workspace-sidebar` resolves the selection store
  inside `close()`, not at setup, where one of them would get the other
  half-built.
- A table that wants the panel needs both halves: an entry in
  `useSidebarContent` and a `select*` call from its name cell. Without the entry
  the panel opens empty whatever is selected, which is how the Self-assigned
  panel first shipped.
- The table pages' containers look alike (a switch over the selection's type),
  and those that search by a number share the search composable. A container
  per page is kept anyway: the screens and actions differ (CREATE only on
  Contacts, SELECT only on a live call).
