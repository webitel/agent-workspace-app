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

**Each sound class takes its own cross-tab lock.** The ring holds its lock while
it runs; the chirp takes a separate one for about a second and lets it expire.
Sharing one lock would have the chirp cut a running ringtone on release, and the
ringtone swallow every chirp behind it.

**A chat arriving during a ringing call is silent.** The call has a deadline and
the chat does not; two overlapping sounds tell the agent less than one clear
one. The card and the OS notification still carry the offer.

**The ringtone follows call offers, not list emptiness.** Otherwise a lingering
chat offer holds the ring open after the call resolved, and dismissing a chat
silences a call that is still ringing.

**The lock fails open, not closed.** Every lock carries an expiry, so an
expired lock reads as no lock at all; it is also released on `beforeunload`, and
every storage access is wrapped — in a private window or with site data blocked
it degrades to "always allowed". Silence must never be the resting state.

**There is no "main tab" slot, and the keys are ours.** The first design kept
one under the bare `currentTabId` key, claimed by whichever tab arrived first
and never expiring — the ui-sdk original's shape. Both halves were wrong. Every
Webitel app shares this origin, and ui-sdk's Vuex module writes `currentTabId`
*unconditionally* on load, so opening the admin panel or the CRM handed the slot
to another app's tab and muted this one for good; a tab that died without
running its unload handler did the same. Locks now live under
`wt/agent-workspace/sound-lock/<kind>`, which no other app writes, and the
legacy keys are left alone because they still belong to the apps that read them.

The cost is that this app and a legacy one no longer dedupe against each other:
with both open during migration, both make noise. That is the right way round —
a duplicated ring is recoverable, a permanently silent workspace is not.

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
