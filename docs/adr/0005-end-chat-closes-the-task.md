# 5. End chat closes the chat's task

Date: 2026-09-30

## Status

Accepted, with one part unverified against a live instance (see Consequences).
Implemented alongside [WS-52](https://webitel.atlassian.net/browse/WS-52).

## Context

The chat top bar has an End button. The spec (AC_03.01.05) calls it "existing
logic", which in `cc-workspaces` was `conversation.leave()` when the chat allowed
leaving, and `decline()` otherwise, behind a confirmation while the chat was
live.

This app does not use the `Conversation` model (see `CONTEXT.md`), and the bar
already holds the chat's `Task` from `webitel-sdk`. Two things could plausibly
end a chat:

- `Task.close()` — `cc_agent_task_close`, the call-center request. `decline()`
  sends the identical request. `cc-workspaces` only ever used these on jobs
  (`channel: "task"`); its chats went through the `Conversation` object, whose
  `leave()` and `decline()` send the chat requests `leave_chat` and
  `decline_chat`. This app's `declineOffer` does call `task.decline()` on chats,
  but that is not evidence the backend accepts it.
- `thread.removeMember({ id })` (chat-web-sdk) with the agent's own member — the
  direct successor of `leave()`.

`Task` sets no local state on close: `state` becomes `processing` only when the
backend's `processing` event arrives, and a queue without post-processing sends
`wrap_time` or `waiting` instead, which removes the task from the feed.

The BE story (WS-51) found the call-center events already carry what the bar
needs; no new API was built for ending.

## Decision

**End chat = `Task.close()`.** The task is the call center's own object for the
chat and the one the bar is already built on; ending it is one call on it. The
call center reacts by starting post-processing or releasing the task, and the
top bar only consumes that state.

**End is confirmed and then held disabled.** The confirmation stays open while
the request runs; after it resolves the button stays disabled, because the state
change arrives later over the socket and a second request in that gap would
fire against a chat already ending.

## Alternatives considered

**Leaving the thread through the agent's own member.** Closest to what
`cc-workspaces` did. It was the first proposal and was built, then dropped. It
ends the chat in the chat backend and lets the call center follow, but it needs
the agent's own member, and nothing on a thread member says which one that is:
the only candidate rule was `contact.sub` equal to the logged-in user id, which
the types do not promise. A wrong rule leaves End disabled everywhere. It also
crosses into the chat SDK for an action the task already exposes.

## Consequences

`Task.allowClose` is `channel === "task"`, and chats are `im`, so the SDK does
not itself treat a chat task as closable this way. `close()` is not gated on it
here. That the backend accepts `cc_agent_task_close` for a bridged chat attempt
is unverified against a live instance, and the old app gives no precedent: it
never sent `cc_agent_task_close` for a chat. Treat the live check as blocking.
If it is refused, the request fails and the error is
shown, and the leave-the-thread route above is the fallback.

The window's `closeChat` is unrelated and unchanged: it drops a window, and must
never stand in for this.
