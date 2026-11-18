# 14. An offline member is called through the queue, and its panel searches the contact by the member's number

Date: 2026-11-12

## Status

Accepted. Implemented in [WS-34](https://webitel.atlassian.net/browse/WS-34)
(Calls section, Offline tab).

## Context

The rows of the Calls section's Offline tab are **Offline members** (see
`CONTEXT.md`), read with `agent.offlineMembers` (`cc_fetch_offline_members`):
a name, a queue and the member's communications (`{ id, destination, type }`).
A row carries no contact.

The other tables that dial — Contacts, and the Calls section's Self-assigned
tab — place a manual call by number with `outboundCallAttempts.start(number)`,
which gives the agent the outbound call card. Their name cell opens the right
panel with `selectContactOrUnknown(contact?.id)`, because their rows come with
a contact.

`cc-workspaces` called an offline member with
`agent.directMember(memberId, communicationId)` (`cc_member_direct`): the queue
places the call to that member on that communication. It showed a loader on the
member while the request ran, reloaded the list once it succeeded, and did not
catch a failure. Its member panel showed no contact; a contact with the
member's number appeared only once the call was on, through the call's own
contact identification.

## Decision

**The member is called through the queue, never dialled by number.** The phones
cell emits the whole communication, not its number, and the table asks the queue
with `directMember(memberId, communicationId)`. The call stays the queue's, and
the member leaves the offline queue. The cell looks like the contacts' one: the
first communication with a destination on the button, the others behind a "+N"
menu that lists numbers only (a member has no primary communication).

**As in `cc-workspaces` around the request.** One request at a time per member,
with the loader on its button; once the queue has taken the call the list is
reloaded from its first page (the table appends pages, so reloading the current
one would read only that page); a refused request is only logged with
`console.error` — no notification, no reload.

**The Offline tab has its own panel, which searches the contact by the member's
number.** The name cell selects the member's first number
(`selectPhoneNumber`, a selection of its own type, `PhoneNumber`). The panel
searches the contacts by it with `findContactIdsByNumber`, the same search a
call's identification uses, honours `WbtHideContact`, and drops an answer for a
number no longer selected. None found, or contacts hidden, shows the unknown
contact card; one or several go to `contact-identification` (ADR-0013), without
`canSelect`: with no call yet there is nothing to link a contact to, so nothing
calls `setContact`.

## Considered options

- **A manual dial by number, as the Contacts table does.** It would give the
  outbound call card, but the call would not be the queue's: the member would
  stay in the offline queue and the attempt would not count for it.
- **Searching in the table and then `selectContactOrUnknown(id)`.** It reuses
  the existing selection, but it takes one id or none, so several found contacts
  cannot be shown, and the panel would open only after the search, with no
  loader in it.
- **An error notification on a refused request.** `cc-workspaces` showed none,
  and the agent sees the row unchanged.
- **Dropping the member's row locally instead of reloading.** It avoids a
  request and keeps the scroll, but assumes the member left the queue rather
  than reading it.

## Consequences

- There is no outbound call card for an offline member: the agent sees whatever
  the queue sends for the call.
- The panel keeps its selection after the call, although the member's row has
  left the list.
- The panel's search repeats the hidden-contact check and the stale-answer guard
  of `useCallContact`; a shared search by number would serve both.
