# 5. End chat leaves the thread; the agent's own member is found by contact subject

Date: 2026-09-30

## Status

Accepted, with one part unverified against a live instance (see Consequences).
Implemented alongside [WS-52](https://webitel.atlassian.net/browse/WS-52).

## Context

The chat top bar has an End button. The spec (AC_03.01.05) calls it "existing
logic", which in `cc-workspaces` was `conversation.leave()` when the chat allowed
leaving, and `decline()` otherwise, behind a confirmation while the chat was
live.

This app does not use the `Conversation` model (see `CONTEXT.md`), and three
things in the new stack could plausibly end a chat:

- `Task.close()` — `cc_agent_task_close`, the call-center request. The SDK's own
  `Task.allowClose` is `channel === "task"`, and chats are `im`, so the SDK does
  not treat a chat task as closable this way.
- `Task.decline()` — the identical request. Used here for offers only.
- `thread.removeMember({ id })` (chat-web-sdk, `DELETE /threads/{id}/members/{id}`)
  with the agent's own member — the direct successor of `leave()`.

`Task` sets no local state on close: `state` becomes `processing` only when the
backend's `processing` event arrives, and a queue without post-processing sends
`wrap_time` or `waiting` instead, which removes the task from the feed.

The BE story (WS-51) found the call-center events already carry what the bar
needs; no new API was built for ending.

Nothing marks which member of `task.thread.members` is the agent. A member has
`id`, `role` and a `contact` with `sub` (the associated internal subject) and
`iss`.

## Decision

**End chat = remove the agent's own member from the thread**, through
`threadsService.removeMember`. The call center reacts by starting
post-processing or releasing the task; the top bar only consumes that state.

**The agent's own member is the one whose `contact.sub` equals the logged-in
user's id** (`useUserinfoStore().userId`), compared as strings. When no member
matches, End is disabled rather than guessed at or silently ignored.

**End is confirmed and then held disabled.** The confirmation stays open while
the request runs; after it resolves the button stays disabled, because the state
change arrives later over the socket and a second request in that gap would
fire against a chat already ending.

## Alternatives considered

**`Task.close()`.** One call, no member lookup, and it is what "close the task"
sounds like. Rejected: the SDK marks chat tasks as not closable that way, and
ending a chat is a membership change in the chat backend — the call-center task
follows from it, not the other way round. It would also leave the agent a member
of a thread their task had ended.

**Matching the agent by `contact.iss` or by comparing with the other members.**
`iss` names the identity provider, not the person; excluding "the client" fails
as soon as a thread has a bot or a second agent.

## Consequences

`removeMember` on the agent's own membership is unverified against a live
instance. So is the assumption that `contact.sub` carries the user id — the
types only say "associated internal system subject". If either is wrong the
symptoms are loud: End stays disabled everywhere (no match), or the request
fails and the error is shown. A `*.live.spec.ts` asserting that exactly one
member of a real thread matches would settle the first; ending a chat on that
instance settles the second.

The same resolver would let `mapMessagesToChatMessages` receive an `isSelf`, so
outgoing bubbles align to the agent — `the-chat-thread` passes none today.

The window's `closeChat` is unrelated and unchanged: it drops a window, and must
never stand in for this.
