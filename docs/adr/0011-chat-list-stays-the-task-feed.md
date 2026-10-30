# 11. The chat list stays the task feed, and reads unread from the thread list

Date: 2026-10-29

## Status

Accepted. Implemented by [WS-55](https://webitel.atlassian.net/browse/WS-55); the
backend side is [WS-54](https://webitel.atlassian.net/browse/WS-54). Builds on
[ADR-0008](0008-snoozed-chats-split-the-task-feed.md), which it leaves standing.

## Context

WS-55 asks for the left panel's Active tab to page on scroll, search by name and
narrow to unread chats. The chat backend now answers each of those for its own
thread list: `GET /v1/threads` pages (`page`, `size`, `next`), searches (`q`) and
filters on unread (`unread=true`), and each thread carries `unreadCount`. The
chats table in the central panel already reads from that endpoint.

That raised the question this record settles: should the left panel be built from
those threads instead of the call-center task feed (`chatTaskList`)?

It was built that way once, as a trial, and the product owner's answer on WS-55
is that the left Active panel holds **only active call-center chats**, and that
snoozed ones live on the Snoozed tab and nowhere else. A thread list also holds
internal chats, which have a thread and no task. They are reached from the chats
table, not from the left panel.

## Decision

**The chat list's rows stay the agent's tasks**, split into Active and Snoozed as
ADR-0008 has it. A task is a call-center chat by definition, so internal chats
are left out by construction rather than by a filter that has to be kept right.

**Unread is the one thing read from the thread list.** Every thread with unread
messages is read once, with `unread=true` (ids and counts, every page), when the
chats feature starts and again after the chats socket reconnects. In between, the
backend pushes a thread's unread count over the chats socket whenever it changes,
because a message arrived or the agent read the thread on any device, and the app
replaces the count it holds. The app counts nothing itself, so it has no need to
tell the agent's messages from the others. Seeing a chat's messages still clears
its count at once, as the thread view marks them read, rather than waiting for the
push.

**The unread filter appears once that first read has answered.** Before then
"nothing is unread" would be a gap and not a fact, and the filter would empty the
list for no reason. An empty answer is an answer: the filter shows, and nothing is
unread. A failed read keeps what is held and shows no filter on its first try.

**Search is over the tasks, on the client, and there is no paging.** The task feed
arrives whole from the call-center socket, so the list shows every chat in it and
narrows by a search on the client's name or username. Paging belongs to the chats
table in the central panel, whose rows are read from REST a page at a time.

**The previews follow every chat the agent has.** Each is counted for unread, so
its count follows the socket whether or not the search or the filter hides it, and
each has its last message read once.

**The tab indicators stay exact.** The task feed is whole, so a tab's grey number
is its real chat count and the green one is the real number of unread chats,
whatever the search or the filter leaves showing.

## Considered options

- **Rows from `GET /v1/threads`.** Built as a trial. It lists internal chats in
  the left panel, which the product owner rules out, and filtering the threads
  down to those that have a task by hand leaves each page part hidden, so counts
  and paging are inexact. It also changes what a chat with no task opens as.
  Rejected.
- **Unread worked out on the client** from the messages the app sees. A count
  that restarts from zero on every load reads as fact (ADR-0001), and it cannot
  hear a read from another tab or device. Built first, then replaced by the
  backend's pushed count. Rejected.
- **A window over the feed** (twenty chats, growing on scroll), to bound the
  history requests. Built as a trial and dropped: the feed is whole, so paging it
  only hides chats the agent has, and the call-center list is not paged.
  Rejected.
- **Hold every chat's last message from one read of the threads** (`ids`, in
  batches) instead of one history request each. Fewer requests, but it would put a
  second source beside the history the chat window already reads. Left as a later
  option, for the day an agent's chat count makes one request per chat too many.

## Consequences

- The pushed count is an event the chat backend is yet to send. `chat-web-sdk`
  emits it as `ThreadUnreadChanged` (`threadUnreadChangedEvent`, `{ threadId,
  unreadCount }`), a name and shape asked of the backend and not yet confirmed.
  Until it ships the counts are the ones read at start and after a reconnect, and a
  new message does not raise them.
- A chat the agent can see in the chats table but not in the left panel (an
  internal one) has no unread count in the panel by design.
- The list costs one history request per chat the agent has, as soon as the chats
  are listed. A call-center agent holds a bounded number of chats, which is why this
  is accepted.
