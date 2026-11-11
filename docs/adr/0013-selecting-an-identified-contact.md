# 13. The agent picks one of several identified contacts while the call is live; the link shows at once and fails silently

Date: 2026-11-11

## Status

Accepted. Implemented in [WS-78](https://webitel.atlassian.net/browse/WS-78)
(US_07.04, calls).

## Context

A call's number can match several contacts. The right panel then shows them one
at a time, with a switcher, "X of Y contacts", whose back and forward icons are
hidden on the first and the last contact (AC_07.04.07–09). SELECT links the call
to the contact on screen, without adding the number to that contact
(AC_07.04.19). Before the call is accepted the contacts are shown, but nothing
can be selected or created (AC_07.04.20). The spec says nothing about the call's
post-processing.

A call is linked with the SDK's `call.setContact(id)`, a socket request. The
link comes back as a socket event that sets the call's contact; the panel
already follows it, and a **Linked contact** replaces whatever the search found
(US_07.05).

`call.state` is the call's last event (`ringing`, `active`, `hold`, `hangup`).
The bridge to the client does not change it: a connected call stays `active`.

`cc-workspaces` showed SELECT and contact creation only while the task was
`active` or on `hold`, did not catch a failed `setContact`, and showed no
loading on SELECT.

## Decision

**The contact block shows, the call links.** `contact-identification` holds
which of the found contacts is on screen and emits `select` with its id. It
knows nothing of the call; the panel passes `canSelect`. Linking is
`selectContact` in `useCallContactIdentification`, next to the identification it
changes. A chat's panel reuses the block with its own linking.

**SELECT and CREATE only while the call is `active` or on `hold`.** Not while it
rings (AC_07.04.20), and not in post-processing, as in `cc-workspaces`. Both
follow one condition in the call panel, so they never disagree.

**The linked contact shows at once.** After `setContact` succeeds the panel
shows that contact alone, without waiting for the socket event, as the only
found contact is linked automatically. The event then brings the same contact,
so nothing flickers. A second SELECT while the request runs is ignored, and a
link that completes after another call was opened is not shown on the new
call's panel.

**A failed link is silent.** The found contacts stay, the shown one included, so
the agent can select again. Only `console.warn` records it. A rejected socket
request does not reach the app-wide socket error notifications (they listen to
the client's `error` event), and `cc-workspaces` showed nothing either.

**The panel's actions share one row with SELECT.** The block renders an
`actions` slot before SELECT; the call panel puts CREATE there. The row is
hidden while the contacts are being identified.

## Considered options

- **An error notification on a failed link.** The rejection is a plain
  `{ id, detail }` object, not an `Error`, so there is no ready message to show,
  and `cc-workspaces` did without one.
- **Waiting for the socket event before showing the linked contact.** The panel
  would keep showing the switcher and SELECT after the click until the event
  arrives.
- **A loading state on SELECT.** `cc-workspaces` had none; the double-click
  guard already prevents a second request.
- **CREATE shown from `answeredAt`, as it was.** `answeredAt` stays set after
  hangup, so CREATE would stay in post-processing while SELECT is gone.

## Consequences

- The switcher's text puts the noun first in `ru`, `uk` and `ro` ("Контакт 2 из
  21"): after a number their noun depends on it, and the app's i18n has no
  plural rules for them.
- A create form left open stays open after the call hangs up; it is closed only
  when another call is opened.
- An agent who wants to link the call in post-processing cannot. If the spec
  asks for it, the change is the call panel's one condition.
		