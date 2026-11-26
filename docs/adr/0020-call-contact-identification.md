# 17. A call's contact is its linked one, otherwise the contacts its number finds; the only match is linked at once

Date: 2026-11-13

## Status

Accepted, recorded after the fact. Implemented in
[WS-80](https://webitel.atlassian.net/browse/WS-80) (US_07.05, calls); found
contacts shown from the search's answer in
[WS-186](https://webitel.atlassian.net/browse/WS-186). Selecting one of several
found contacts is ADR-0013, which made `useCallContact` the one owner of this
logic. The number search is reused by the table pages' panels (ADR-0014,
ADR-0015, Missed).

## Context

US_07.05 asks the Call window's right panel to show the call's contact.

A call may already be linked to one: `call.contact` is set by the flow, by the
queue, by another agent, or by an earlier `setContact`. A transferred call may
carry no contact of its own while the call it is bridged to does. Otherwise
the client has to be found by the number.

The backend needed no changes for this. Contacts are searched with
`GET /contacts?qin=phones&q=<number>`; for US_16.03 the backend pointed out that
`q==+E.164` gives an exact match.

`cc-workspaces` identified a call this way: the linked contact, the bridged
call's contact for a transfer, otherwise a search by number in the contacts'
phones (`q: number`, 100 results, WTEL-7906), and `setContact` when exactly one
contact is found. It kept the found contacts as the search returned them and
showed each one from that list, so switching between them made no request; only
a linked contact was loaded by its id. It hid the contact block when the call's
`hideContact` or the `wbt_hide_contact` system setting was on.

The search's answer carries every field of a contact asked for in `fields`.
Without `fields`, `ContactsAPI.getList` asks for all the contact card shows
except `groups`.

## Decision

**Identification works as in `cc-workspaces`.**

**The linked contact comes first.** The call's own `contact`, otherwise, for a
transferred call, the contact of the call it is bridged to (`bridgedId`). It
is loaded by its id (`ContactsAPI.get`), with a loader, unless it is one of the
contacts the panel already holds: the only match it has just linked, the one the
agent selected, or a found contact someone else linked. That one is shown at
once, with no request and no loader, so the socket event that links it changes
nothing on screen.

The SDK does not order the reply to `setContact` and the `set_contact` event:
they are separate socket messages, handled as they come. So the panel looks the
linked contact up in every contact it holds, not only the shown ones: the agent
search's result, the identified contacts, and the contacts the number search
found while the only one of them is still being linked
(`identifyCallContact`'s `onFound`, not shown until the link succeeds). An event
that comes first finds the contact there and loads nothing.

**Otherwise the number is searched in the contacts' phones**: `call.displayNumber`,
`qin: 'phones'`, `q: number`, 100 results (`findContactsByNumber`). This is
the same loose match as `cc-workspaces`, not the exact `q==+E.164`. A call with
`hideNumber` is not searched.

**Found contacts are shown from the search's answer**, as in `cc-workspaces`.
The search asks for the fields the contact card shows, with `id` to link a
contact (`CONTACT_FIELDS`), and the panel keeps the contacts, not their ids. Switching between several found contacts makes no request and shows
no loader. The agent's own search (ADR-0013) asks for the same fields. The
contact card only renders a contact it is given; `contact-card-by-id` loads one
known only by its id, for the table pages' panels.

**The only match is linked at once** with `call.setContact`. Several are left
for the agent to choose from (ADR-0013). None found gives the not-found state.

**A failed automatic link shows nothing.** The panel shows no contact rather
than the found one: showing it would present a contact the call is not linked
to as the call's contact. Only `console.warn` records it, as `cc-workspaces`
showed nothing either. A failed search also shows nothing; `@webitel/api-services`
raises the error notification.

**A linked contact that fails to load is not the Unknown contact.** When the
call is linked but `ContactsAPI.get` fails (no access to the contact, a network
error), the block shows neither a card nor the Unknown contact card in its place
(`isLinkedContactUnavailable`): the call has a contact, and showing it as
unknown would lead the agent to CREATE a duplicate. The search and the row of
actions stay, as for any linked contact; `@webitel/api-services` notifies the
agent of the failure. The agent's search shows its result over it, and Cancel
brings it back.

**A hidden contact is neither searched for nor shown.** With the call's
`hideContact` or the `WbtHideContact` system setting on, the contact block is
left out entirely: no Unknown contact, no CREATE. The call info stays.

**Identification reruns** when the call changes, when its linked contact
changes (our own link, another agent's, a transfer), and when hiding changes. A
linked contact replaces whatever the search found or is still looking for. Only
the newest request may write its result.

**It lives in the calls feature, not in the panel.** `features/calls/modules/contact`
holds everything about a call's contact: `getCallContactId`,
`identifyCallContact`, `findContactsByNumber`, `CONTACT_FIELDS`, and
`useCallContact`, which the call panel uses. The panel only renders the result. The incoming call's offer
card, which will need a call's contacts too, is meant to use the same module.

## Considered options

- **The exact match, `q==+E.164`.** It finds a contact only if the number is
  stored exactly as the call presents it. Not taken: identification keeps the
  behaviour agents know from `cc-workspaces`, and a looser match costs at most
  several found contacts for the agent to choose from.
- **Showing the found contact when the automatic link fails.** The panel would
  show a contact the call is not linked to, and nothing would say so.
- **The Unknown contact for a linked contact that fails to load.** The panel
  would call a linked call's client unknown and invite a duplicate.
- **Hiding CREATE for a linked contact that fails to load.** CREATE stays beside
  a linked contact that loads, so hiding it only on a failure would make the
  row depend on a request's outcome; whether CREATE belongs beside a linked
  contact at all is a question for the spec.
- **An error notification on a failed link.** `cc-workspaces` had none, and the
  rejection is a plain `{ id, detail }` object with no ready message
  (ADR-0013).
- **The Unknown contact card for a hidden contact.** Hiding is meant to keep
  the contact off the screen, and `cc-workspaces` hid the whole block.
- **Found contacts as ids, each loaded when shown.** Every switch between them
  would replace the card with a loader while one more request runs, though the
  search has already returned the contact.
- **Caching or preloading each found contact by its id.** Up to 100 requests
  for what one answer already holds.
- **The `getList` default fields.** The card would show no groups for a found
  contact, but would for the same contact once it is linked and loaded by id.
- **Identification inside the panel component.** Kept out of it in review: it
  is the call's logic, and the offer card and later actions (selecting, linking
  a created contact) need the same state.

## Consequences

- The loose match can find contacts whose numbers only share part of the
  call's number. They come up as several found contacts.
- A failed automatic link looks the same as no contact found; only the console
  tells them apart.
- A linked contact that fails to load leaves an empty place in the panel, with
  only the api-services notification to explain it.
- The only match is linked whatever the call's state, a ringing Offer opened in
  its Call window included. ADR-0013 holds SELECT and CREATE back until the call
  is active or on hold; the automatic link has no such condition.
- The search runs each time the panel opens on a call with no linked contact:
  the identification lives as long as the panel.
- A found contact is shown as the search returned it. Changes made to it
  elsewhere while it is on screen show only after the next search or link.
- A field the card starts to show has to be added to `CONTACT_FIELDS` too, or
  a found contact shows it empty while a contact loaded by its id does not.
- A linked contact opened with the call is loaded once, with a loader; the
  panel shows the call info meanwhile.
- The table pages' panels search a row's number with the same
  `findContactsByNumber`, but repeat the hiding check and the stale-answer
  guard on their own (ADR-0014).
