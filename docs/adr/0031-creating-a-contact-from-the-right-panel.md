# 31. A contact is created in the right panel; the panel decides what follows, and a call links it as SELECT does

Date: 2026-11-26

## Status

Accepted. Implemented in [WS-82](https://webitel.atlassian.net/browse/WS-82)
(US_07.06). Changes one consequence of ADR-0013: a create form left open now
closes when the call hangs up.

## Context

CREATE opens a create form in the right panel (AC_07.06.02). The button is on
the Contacts page's empty panel (US_07.08) and in the call panel while the call
is an **Active call** (US_07.03–07.05, ADR-0013). The form asks for a name,
which is required, and optionally a phone number, an email, a timezone, an
owner (the agent by default), labels and a description. SAVE creates the
contact and opens its card (AC_07.06.03). CANCEL creates nothing and goes back.

The backend creates the contact with the existing `POST /contacts` (WS-81). A
phone or an email is accepted only with a communication type, and the form has
no type field. `GET /contacts/labels` lists only the labels some contact already
carries.

The spec does not say what happens to the call. `cc-workspaces` links a contact
created during a call to the call at once. WTEL-10527 describes the same
behaviour.

## Decision

**The form checks, the panel saves.** `contact-create-form` holds the draft,
checks it and emits `submit`. `useContactCreation` saves it: it sends
`ContactsAPI.add`, ignores a second SAVE while one is in flight, and returns the
new id, or `null` when nothing was created. The form then stays open with what
was typed, and api-services has already notified the agent. CANCEL is disabled
while the form is saving: a request already sent cannot be taken back, so a
CANCEL then would close the form over a contact that is created anyway (and,
in a call, linked). The contact card's
add form (WS-171) works the same way. Each panel decides what follows:

- The **Contacts panel** selects the new contact, as if its row had been picked.
  On the Contacts tab it then reads the list again from its first page. The
  Users tab lists users, and the Contacts list is read afresh when its tab
  opens, so nothing is reloaded there.
- The **call panel** links the contact to the call through `selectContact` in
  `useCallContact`, the same path SELECT uses. The panel then shows it as the
  **Linked contact**. It links only to the call the contact was created for:
  if the agent has opened another call, or this one has hung up during the
  save, the contact is created and left unlinked. The form stays open and
  saving until the link answers. If it closed earlier, the panel would show the
  old Unknown card with CREATE for the length of the socket round trip. A
  failed link is silent, as with SELECT (ADR-0013). CREATE is also offered when
  the call already has a **Linked contact** (AC_07.05.15), so a created contact
  replaces that link, as SELECT on a search result does.
- A save that answers after the Contacts panel is gone (page left, panel
  closed), or after the agent picked another row, changes nothing. Selecting
  the contact would reopen the panel or overwrite the agent's choice.

**The form's open state is local to the panel.** No store holds it. A page
change closes the panel, and with it the form. The call panel also closes the
form when another call opens or the call hangs up. The Contacts panel closes it
when a new row is picked.

**Phone and email get their channel's default type.** The default type is read
at SAVE, only when a phone or an email was typed, as `cc-workspaces` does. A
channel without a default type sends none, so the backend's error reaches the
agent. The app does not pick another type for them.

**Labels accept a typed value.** Since the lookup lists only labels already in
use, a tenant with none would offer an empty list.

**Validation: the name and a typed email.** A typed email is checked by the
rule CRM and the card's add form use. A phone has no format rule there either.

## Considered options

- **The form saves by itself and emits `created`.** This was rejected because
  the WS-171 review moved saving out of the card's add form, and the two forms
  should not differ.
- **A store for the form's open state.** Nothing outside the panel reads it, and
  unmounting the panel already resets it.
- **The first type of the channel when no default exists.** This would choose a
  type silently, one the tenant did not mark as default.
- **Sending the contact to the post-processing flow (WTEL-10527) here.** The
  backend's answer is a `cc_component_action` with `variables: { contact_id }`,
  sent while post-processing is open. This is left to WTEL-10724. Three things
  are still open there:
  - which component and action the flow expects;
  - that the SDK's `task.componentAction` needs a form that is open, while the
    contact is usually linked during the call, before any form arrives;
  - that a call without a task has no attempt to send it to.

  SELECT and CREATE share one link path, so the send can be added in one place.

## Consequences

- If the link fails, the contact is still created, but it is not linked to the
  call. The agent can find it with the panel's search and SELECT it.
- The saving state belongs to the call panel, not to one call. If an agent
  starts a save on one call, opens another and opens the form there, SAVE there
  waits for the first save.
- The chat's right panel has no contact block yet. Linking a created contact to
  a chat (the IM contact and the thread) comes with that panel.
