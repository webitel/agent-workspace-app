# 12. The contact card's Communication section shows what the contact returns, messengers included as bare icons

Date: 2026-11-10

## Status

Accepted. Implemented in [WS-125](https://webitel.atlassian.net/browse/WS-125)
and [WS-171](https://webitel.atlassian.net/browse/WS-171) (US_07.07).

## Context

The contact card (Е7) shows a contact's phones, emails and messengers under
"Communication options", on Phones, Messaging and Emails tabs (AC_07.07.02–04).
All three come with the contact itself: `ContactsAPI.get` already asks for
`phones`, `emails` and `imclients`, so the section adds no request.

Phones and emails carry their value (`number`, `email`). A messenger
(`imclients`, `ContactsIMClient`) does not have one field to show. A link to a
messenger is one of two kinds, never both — see **IM client** in `CONTEXT.md`:

- a legacy chat client, with `user` (`{ id, name }`, from the external service);
- an IM-stack contact, with `imContactId` (a UUID from the im-contact-service)
  and no `user`.

On the test stand `user.name` holds the client's name and their username as one
string (`"Name Surname username"`); there is no username field of its own. The
other fields on a record are not for the agent's eyes: `externalId` is the
client's id inside the messenger, `app.name` is the name of our own bot, and
`imContactId` is a UUID. The gateway comes as `protocol`, with the values of
`ChatGatewayProvider` (`telegram`, `viber`, `infobip_whatsapp`, …).

## Decision

**A pure mapper, `toContactCommunication`, turns the contact into three lists of
`{ id, value, icon? }`,** one per tab, in the order the API returns them. The
section renders whichever list is active, without knowing which tab it is. Phones
and emails get a fixed icon; a messenger gets its gateway's icon from ui-sdk's
`ProviderIconType[protocol]`, and an unknown `protocol` gives no icon rather than
an error.

**A messenger shows `user.name` as it comes.** The username is not cut out of
the string: there is no rule for where the name ends.

**Every messenger record is listed, and one without `user` shows as its gateway
icon alone.** The agent still sees that the contact can be reached there. Nothing
else on the record is shown in place of the name — what the backend does not
return is left out, not approximated, as in ADR-0001 and ADR-0010. Phones and
emails without a value are dropped.

**A phone or an email is added inline, on its own tab** (AC_07.07.08–09). An
add button sits at the right of the tab row on Phones and Emails; Messaging has
none (AC_07.07.10 is not built). It opens a form between the tabs and the list:
the value (Phone number / Email) and a **Communication type** of that tab's
channel, loaded with `CommunicationsAPI.getLookup`, with no type picked in
advance. A second click leaves the open form as it is. Cancel and save sit
below, cancel first, as in the design. Switching the tab or the contact drops
the form and what was typed.

The rules are CRM's, taken from `contactPhoneSchema` / `contactEmailSchema` in
api-services: a value and a type are required, an email must look like one, a
phone number has no format. Save stays disabled until they pass, and a malformed
email is marked under the field. The record goes through `PhonesAPI.add` /
`EmailsAPI.add` with `primary` set when it is the first on its tab, as CRM and
cc-workspaces do. While it is saving, save is disabled; a failure is notified by
api-services and leaves the form open with what was typed. On success the form
closes and the card refetches the contact in place (`useContact().reload`): no
loader, the order stays the API's.

The add button is shown to every agent: the spec sets no rights for it and
cc-workspaces checks none. A save the backend refuses fails like any other.

Call and Send message (AC_07.07.05–06) are not rendered; each row has an empty
`actions` slot for them.

## Considered options

- **A fallback for a messenger without a name** (`externalId`, `app.name`). Both
  are on the record, neither identifies the client to an agent, and `app.name`
  would name our bot as if it were them.
- **Icons chosen in the component per tab.** It would keep the mapper smaller,
  but a phone reached through a messenger gateway (not MVP) would then need a
  branch in the template; with the icon on the row it is a mapper change.
- **CRM's rights check on add** (the contact's `mode` has `w` and the user can
  create Contacts). Not in the spec; left for the BA to ask for.
- **`WtInlineAddPanel` from ui-sdk.** It puts save before cancel and spaces them
  closer than the design, so the form lays out its own two buttons.
- **Pushing the saved record into the shown contact,** as cc-workspaces does.
  It would mutate the loaded contact and guess where the backend puts the
  record; a refetch shows what is stored.

## Consequences

- What to show for an IM-stack contact is an open question to the backend. Once
  answered, it is a change to the mapper's messenger row only.
- `user.name` stays name and username together until the backend returns them
  apart.
- Empty tabs show an empty list; empty states are deferred, as for the card's
  Info fields.
- An agent without the right to edit the contact can fill the add form and only
  learns it from the error on save. Adding the check is a condition on the add
  button.
