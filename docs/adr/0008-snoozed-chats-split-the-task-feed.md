# 8. Snoozed chats split the task feed by a set of thread ids

Date: 2026-10-22

## Status

Accepted. To be implemented in [WS-57](https://webitel.atlassian.net/browse/WS-57);
the backend side is [WS-56](https://webitel.atlassian.net/browse/WS-56).

## Context

The chat list's rows are the agent's chat tasks from the call-center feed
(`chatTaskList`, webitel-sdk), not threads from the chat backend — a decision
taken for the Active tab in WS-55 and kept since.

Snoozing lives only in the chat backend: a personal `snoozed` tag on the thread,
set with `POST /v1/threads/{id}/snooze` and cleared by the backend itself when a
message the agent did not send arrives, or when the agent leaves the thread.
`GET /v1/threads` filters on it (`tags`, `exclude_tags`) and the chats socket
reports changes as `thread_tags_changed_event`. The call-center engine knows
nothing of tags, so the tasks carry no trace of it.

The backend's suggestion — list the Active tab with `exclude_tags=snoozed` and
the Snoozed tab with `tags=snoozed` — assumes the list is built from threads.

## Decision

**Both tabs stay on the task feed, split by a set of snoozed thread ids.** The
set is read from `GET /v1/threads?tags=snoozed` (ids only, every page) when the
chats feature starts and again after the chats socket reconnects, and is kept
current between those reads by `thread_tags_changed_event`. A task whose thread
is in the set is on the Snoozed tab; every other task is on the Active tab. The
agent's own Snooze adds the id at once and takes it back if the request fails.

A snoozed thread with no task in the feed is not shown anywhere: not listed
means not on the chat list, whatever the tag says.

## Considered options

- **Snoozed tab from `GET /v1/threads?tags=snoozed`.** Its rows would be
  threads, not tasks, so the Chat preview, opening a chat and ending it would
  each need the task looked up again — and the two tabs would page, search and
  refresh differently.
- **Ask each listed thread for its tags.** One request per listed chat for what
  one list request answers.

## Consequences

- The `tags` diff in `GET /v1/updates` is not used; the reseed after a reconnect
  covers the same gap.
- Paging on scroll exists only inside the id read. The tabs show every listed
  chat, like Active since WS-55.
- `@webitel/chat-web-sdk` has to learn the `tags` / `exclude_tags` / `fields`
  search params, `snooze` / `unsnooze`, and the tags-changed socket event before
  the app can use any of it.
