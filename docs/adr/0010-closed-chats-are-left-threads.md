# 10. Closed chats are the threads the agent has left

Date: 2026-10-23

## Status

Accepted. To be implemented in [WS-46](https://webitel.atlassian.net/browse/WS-46)
(Closed tab) and [WS-100](https://webitel.atlassian.net/browse/WS-100) (Closed
chat card), as one stack; the backend side is
[WS-45](https://webitel.atlassian.net/browse/WS-45) and
[WS-96](https://webitel.atlassian.net/browse/WS-96).

## Context

Everything the app shows about a chat so far starts from the agent's call-center
**Task**: the chat list, the chat window, the top bar, the processing form. Once
post-processing ends the task is released and leaves the feed, and the app has
nothing left to hang the chat on.

The chat backend has its own answer: `GET /v1/threads/left` lists the threads the
caller has left, and `GET /v1/threads/{id}/left_threads/messages` returns their
history limited to the caller's closed **Membership periods**. Neither is in
`@webitel/chat-web-sdk` yet. A left thread carries members and variables, but no
queue, no source, and nothing about when the agent joined or left.

The spec says "closed" for two different things: a chat whose interaction is
over but which still sits on the Active list (AC_02.03.05–06), and the history on
the Closed tab. See **Ended chat** and **Closed chat** in `CONTEXT.md`.

## Decision

**A Closed chat is a thread the agent has left, one per thread.** It is read from
the chat backend, not from the call center. A thread the agent has rejoined is an
active chat only and is dropped from the Closed list.

**The chat window serves both, on the same `/chats/:threadId`.** A thread with no
task in the feed is shown as a Closed chat — but only after the feed's first
load, so a window already open in the app never flashes as closed. (A cold deep
link is a different case: it is sent back to `/chats` and opens no window, see
Consequences.) A thread that is
neither active nor left shows "not found". When the agent leaves the thread with
its window open, the window turns into the Closed chat card in place, and its
history is read again from the left-threads endpoint.

**A Closed chat has its own small store**, separate from the chat session: the
thread from `/threads/left`, history by cursor from `left_threads/messages`, and
no socket. A former member receives no events, and ADR-0007's session is defined
by following the socket.

**Two clients, as on the Active side.** The Closed tab is a datalist table on
`@webitel/api-services`, like the Active table. The card reads through
`@webitel/chat-web-sdk`, which has to learn `searchLeft` (with paging) and the
left-thread history, and returns a thread that cannot send and messages that
cannot be marked read.

**What the backend does not return is left out, not approximated** (as in
ADR-0001): no queue, no Started/Ended/Duration from `thread.created_at`, no
Message from `thread.last_msg`, Duration not sortable, search hidden until it
exists. The client is the member whose contact the chat backend issued as
neither `webitel` (agents) nor `bot` (WS-96), so a transfer that leaves other
agents in the thread does not confuse it.

**No Reopen.** The backend has no reopen; a "via" send is a different feature
and is not offered under that name. The Post-processing tab is shown disabled
until the backend returns submitted forms; Info shows the thread's variables and
says the task's are not available.

## Considered options

- **Closed chats from the call center** (closed tasks / attempt history). Not
  checked against the API — an attempt at least knows its queue — but a chat
  transferred back and forth is several
  attempts — several rows for one conversation — and the history would still
  have to come from the chat backend.
- **A separate route for the card** (`/chats/closed/:threadId`). It makes the
  mode explicit, but the open window would have to redirect when the agent leaves
  the thread, and an old link would land on the wrong card once membership
  changes.
- **A mode flag on the chat session store.** It would share the loading code, at
  the cost of a store whose lifetime rules (ADR-0007) do not apply to half of
  its instances.

## Consequences

- Until WS-96 adds an `ids` filter (or `GET /v1/threads/{id}` answers former
  members), a Closed chat opened without its thread in hand — the window turning
  closed in place after the agent leaves — finds its thread by paging
  `/threads/left`. Opening from the Closed tab hands the row's thread over and
  costs nothing.
- Messages the client wrote between two of the agent's periods, or after the
  last, are not part of the Closed chat. That is the backend's choice, and the
  card does not mark where one period ends.
- Name and Source columns and the card's contact icon (Е7,
  [WS-88](https://webitel.atlassian.net/browse/WS-88)) are not linked to the
  contact mini-card here.
- ADR-0007's "a deep-linked chat that was never listed lives as long as its
  window" now applies to active chats only. A window over a thread with no task
  keeps no chat session, and the Closed chat's store is dropped whenever its
  thread has a task again.
- "Feed ready" is taken to be the agent session being loaded, and that holds:
  `agentSession()` in webitel-sdk requests the agent's active tasks before it
  resolves, and `src/app/stores/workspace.ts` awaits it before
  `useChatsStore().initialize()`, while `main.ts` awaits the workspace before the
  app mounts. The feed is complete at startup, so `pending` is a guard users
  rarely see. It does stay in place for a session that has no agent (the
  workspace store only warns then), where the feed is never ready.
- The chats workspace still sends a URL for a chat not opened this session back
  to `/chats`, as it does for active chats, so a deep link or a refresh does not
  reach a Closed chat card. The Closed tab opens its rows from inside the app.
