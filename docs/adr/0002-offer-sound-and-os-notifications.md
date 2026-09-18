# 2. Offer sound and OS notifications

Date: 2026-09-18

## Status

Accepted. Implemented alongside
[WS-32](https://webitel.atlassian.net/browse/WS-32) and
[WS-19](https://webitel.atlassian.net/browse/WS-19).
Extends [ADR-0001](0001-incoming-interaction-offers.md).

## Context

An offer has to reach an agent who is not looking at the card: on another route,
in another tab, or with the browser in the background. Three mechanisms are
available — a sound, an OS notification, and the card itself — and each has
constraints that are easy to get wrong.

Every open tab runs its own `Client` and receives the same event, so sound is a
cross-tab problem, not a per-tab one. Browsers reject `play()` before the
document has been interacted with. `HTMLMediaElement.play()` returns `undefined`
rather than a promise on older Safari and in jsdom. OS notifications with action
buttons require a service worker; the page-level `Notification` API cannot
provide them.

`ui-sdk` ships a Vuex `NotificationsStoreModule` covering some of this. It
cannot be reused — this app has no Vuex — but its mechanics are worth taking,
along with two defects worth not taking.

## Decision

**A looping ring and a one-shot chirp are different things.** Calls ring
(`ringing.mp3`, looped); chats chirp once (`chat-new.wav`). A looping phone ring
for a text chat is wrong on its own terms, and an agent handling several chats
could not tell what was demanding attention.

**Only the loop takes the exclusive cross-tab lock.** The lock means "a loop
owns the sound channel while it runs". A one-shot that took it would silence a
second chat arriving a moment later, and releasing it afterwards would cut a
running ringtone. The chirp respects only the main-tab rule, so tabs do not
chirp in chorus.

**A chat arriving during a ringing call is silent.** The call has a deadline and
the chat does not; two overlapping sounds tell the agent less than one clear
one. The card and the OS notification still carry the offer.

**The ringtone follows call offers, not list emptiness.** Otherwise a lingering
chat offer holds the ring open after the call resolved, and dismissing a chat
silences a call that is still ringing.

**The lock fails open, not closed.** It is released on `beforeunload`, it
expires when stale, and every storage access is wrapped — in a private window or
with site data blocked it degrades to "always allowed". A crashed tab must not
mute the app permanently, which is the failure mode of the ui-sdk original.

**The service worker is notification-only.** A hand-written `public/sw.js`, no
`vite-plugin-pwa`, no workbox, no precaching. The only capability needed is
`showNotification` with action buttons; precaching an SPA buys nothing here and
is a known source of stale-asset bugs.

**Notifications are tagged with the interaction id, and that id travels back**
in the `notificationclick` message. Closing targets the tag. Nothing is posted
while the tab is visible — the card already covers that case. Permission is
requested on the first user gesture, since Chrome requires user activation.

## Consequences

An agent mid-call, looking away, gets no audible cue for an incoming chat. That
is correct — they are occupied with a live customer — but it will eventually be
reported as a bug.

The service-worker spec cannot run in parallel: a registration and the
notifications it creates are per-origin browser state that Playwright does not
isolate per test. It lives in its own `service-worker` project, run through
`npm run test:e2e:sw`. Across parallel workers it failed roughly twice in
twenty; serially it has passed 20/20 repeatedly.

## Defects deliberately not carried over from `cc-workspaces`

**The interaction id was missing from `notificationclick`.** It posts
`{type, action}` and subscribes once per notification, so with two offers on
screen, clicking Accept on the second can answer the first.

**Closing matched on title.** `getNotifications({title: 'New call'})` closes
every matching notification, so one call ending dismisses another call's live
one.

Both are invisible with a single offer and unavoidable with two, which is why
they survived so long.

## Notes

`registration.getNotifications({tag: undefined})` matches **every** notification,
not none. Any guard on a message payload must reject a missing id rather than
default it, or one malformed message closes everything.
