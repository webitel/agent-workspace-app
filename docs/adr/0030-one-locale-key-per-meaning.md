# 30. One locale key per meaning, ui-sdk's first, kept so by a test

Date: 2026-11-25

## Status

Accepted. Raised in review of WS-163 (NWS localization), after "Message" was
found under two keys.

## Context

The app's messages (`src/app/locale/`) had grown per screen: each module added
its own key even when another module already had the same text with the same
meaning. "Unknown contact" was under three keys, "Post-processing" under three,
"Queue" was an app key in eight places and `objects.queue.queue` from ui-sdk in
three. The values of the other seven locales are generated rather than written
by a translator, so two keys that read the same in English drift apart in the
others (`uz` already had "Maʼlumot" next to "Ma'lumot"). ui-sdk's messages are
merged into the same i18n instance and already translated into all nine locales.

## Decision

- A text already in `@webitel/ui-sdk`'s locale with the same meaning (checked in
  English and Ukrainian) is read from there: `objects.queue.queue`,
  `objects.contact`, `objects.chat.chat`, `objects.team`, `reusable.status`,
  `reusable.name`, `webitelUI.iconAction.hints.variables`.
- Inside the app, one meaning has one key. A text shared by several modules goes
  under `ui.reusable.*` (`unknownContact`, `info`, `interactions`, `message`,
  `waitTime`); a domain term stays with its domain
  (`ui.processing.postProcessing.title` for every Post-processing tab and the
  call history popup, `ui.chatList.tabs.active` for both Active chats tabs).
- Equal English text is not enough to merge. Keys stay apart when the meaning
  differs (an action vs a channel state, an agent's name vs a queue's).
- Where two keys had different wording, the product chose one (2026-11-25):
  "Wait time", "Post-processing", «Інформація» for every Info tab,
  "Interactions" for both windows, and ui-sdk's «Знімки екрана»
  (`objects.screenshots`).
- `src/app/locale/__tests__/locale-duplicates.test.ts` fails on two app keys
  with the same English text, and on an app key whose English and Ukrainian
  match a ui-sdk key. Each deliberate exception sits in an allow-list with its
  reason; the test also fails on an allow-listed key that no longer exists.

## Consequences

- The iFrame tab keeps its two keys ("iFrame" in the call window, "Iframe" in
  the chat window) and is allow-listed: the tab is not built yet and may be
  renamed, so its texts are settled then.
- A ui-sdk text changes under the app when ui-sdk changes it. That is the point
  of reusing it, and the reason the test checks the meaning in two languages
  before calling it a duplicate.
- The transfer popup's queues table reads its Name column from `reusable.name`
  («Назва»), where it used to share the agents' «Ім'я».
