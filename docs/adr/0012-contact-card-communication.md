# 12. The contact card's Communication section shows what the contact returns, messengers included as bare icons

Date: 2026-11-10

## Status

Accepted. Implemented in [WS-125](https://webitel.atlassian.net/browse/WS-125)
(US_07.07, display only).

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

**Actions are not part of this section yet.** Call, Send message and Add
(AC_07.07.05–06, 07.08–07.10) are not rendered; each row has an empty `actions`
slot for them.

## Considered options

- **A fallback for a messenger without a name** (`externalId`, `app.name`). Both
  are on the record, neither identifies the client to an agent, and `app.name`
  would name our bot as if it were them.
- **Icons chosen in the component per tab.** It would keep the mapper smaller,
  but a phone reached through a messenger gateway (not MVP) would then need a
  branch in the template; with the icon on the row it is a mapper change.

## Consequences

- What to show for an IM-stack contact is an open question to the backend. Once
  answered, it is a change to the mapper's messenger row only.
- `user.name` stays name and username together until the backend returns them
  apart.
- Empty tabs show an empty list; empty states are deferred, as for the card's
  Info fields.
