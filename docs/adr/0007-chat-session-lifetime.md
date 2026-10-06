# 7. A chat session lives while its chat is listed or has a window

Date: 2026-10-06

## Status

Accepted. Implemented alongside [WS-63](https://webitel.atlassian.net/browse/WS-63).

## Context

A chat's thread and message history live in a per-chat session store, created
when its window opens. It used to be disposed when the window closed, so
reopening a chat re-read the thread and its newest 30 messages and lost every
older page the agent had scrolled back to. The chats socket only reached
sessions with an open window, so keeping a session past its window would have
let it go stale.

The chat list's last messages live in a separate chat previews store, which
reads 10 messages per listed chat once and then follows the socket. Accepting a
chat from the offer card opens its window as it joins the list, so that chat's
history is read twice: once by the session, once by the previews store.

## Decision

**A chat session exists while its chat is listed or has a window**, and is
disposed when neither holds. "Listed" is the chat list (`chatTaskList`, accepted
chats). A deep-linked chat that was never listed lives as long as its window; a
chat that leaves the list (its task was released) keeps its session until its
window closes. Close window stays a view concern, as the glossary has it.

Every live session follows the socket, open or not. A session shown again
re-reads its thread only — read states and delivery ticks come from the
thread — not its history.

**The two history reads on accept are kept.** The obvious dedupe — skip the
previews read while a session is loading — depends on whether the task's
`bridged` frame lands before or after the window opens, which is not under the
app's control. It would hold only some of the time, to save one small request
per accepted chat.

## Consequences

- The coordinator (`chats.ts`) decides which sessions live; `chat-session.ts`
  only keeps the registry and disposes what it is told to.
- Memory grows with the number of listed chats an agent has opened, bounded by
  the list.
- A retained session can only be as current as the socket. Catching up after
  the socket drops is the socket's job, not the session's lifetime's.
