# agent-workspace-app

Operator (agent) workspace, built on the current frontend stack: Vue 3 +
Pinia, Vite, Biome, vitest and Playwright. Served under the `/agent-workspace`
base path.

Not to be confused with `cc-workspaces`, the previous-generation operator
workspace. Logic is regularly ported across from it; its conventions are older
and should not be carried over wholesale.

## Architecture decisions

`docs/adr/` — read the ones touching the area you are about to work in.
- [ADR-0001](docs/adr/0001-incoming-interaction-offers.md) — incoming call and
  chat offers: the notifications module boundary, the channel-neutral preview
  contract, offers derived from the SDK feeds, and why a field is left absent
  rather than approximated.
- [ADR-0002](docs/adr/0002-offer-sound-and-os-notifications.md) — ringtone vs
  chirp, the cross-tab sound lock, and the notification-only service worker.
- [ADR-0003](docs/adr/0003-agent-status-transport.md) — agent status is written
  over REST by the SDK's status select but read off the websocket session, and
  why that read needs an explicit subscription to stay current.
- [ADR-0004](docs/adr/0004-processing-form-state.md) — processing form values
  live on the SDK task, and a per-attempt store holds only the UI state around
  them.
- [ADR-0005](docs/adr/0005-end-chat-closes-the-task.md) — ending a chat closes
  its task, and why leaving the thread was not used.
- [ADR-0006](docs/adr/0006-info-tab-variables.md) — the Info tab merges the
  task's and the thread's variables, shows a key held by both twice, and treats
  a 403/404 on the thread read as "none".
- [ADR-0007](docs/adr/0007-chat-session-lifetime.md) — a chat session lives
  while its chat is listed or has a window, and why the chat preview's history
  read is not deduplicated against it.
- [ADR-0008](docs/adr/0008-snoozed-chats-split-the-task-feed.md) — the chat
  list's tabs stay on the task feed, split by the set of threads the chat backend
  has tagged snoozed, and why the tabs are not listed from threads.
- [ADR-0009](docs/adr/0009-call-info-tab-variables.md) — a call's Info tab
  shows the call's own variables only, and why it does not merge like a chat's.
- [ADR-0010](docs/adr/0010-closed-chats-are-left-threads.md) — closed chats are
  the threads the agent has left, opened in the same chat window once no task
  backs them, read without a socket, and shown without what the backend does
  not return.

## Language

**Agent status** — an agent's call-center state: `online`, `pause`, `offline`,
`break_out`. It lives on the websocket agent session and decides whether work is
distributed to them.

**User status** — a user's presence: `sip`, `web`, `dnd`, `busy`. It lives
behind REST `/presence` and backs the header's DnD switcher.

The two are unrelated and both are reachable from the header, one control beside
the other. An agent can be Online and DnD at once.

**Processing form** — a backend-driven form attached to a task attempt (a chat,
and later a call). It can arrive at any point — on bridge, mid-interaction, on
transfer — not only after the interaction ends. Submitting one of its actions
either brings the next form or releases the task.

**Post-processing** — the timed phase after an interaction ends, in which the
agent finishes the processing form before the task is released. It has a
deadline the agent may renew a limited number of times.

A processing form can exist without post-processing (it arrived mid-chat).

**Reporting** — post-processing without a processing form: the agent marks the
interaction successful or not, and for a failure may set when the client is
tried next. It is how a queue with post-processing but no form schema lets the
agent finish before the deadline. Not built yet, for any channel: such an
interaction shows no Post-processing tab, and its task is released when the
deadline passes.

The chat window's
tab is labelled "Post-processing" by design, but it hosts the processing form
whenever one exists.

**Thread** — a chat as the chat backend models it: its members, its message
history, what gets sent to it. It is addressed by its thread id, which is also
the chat route's param.

**Task** — the call-center side of the same chat: the distribution attempt that
offered it to this agent, carries its processing form and ends in
post-processing. One thread can see several tasks over its life (a transfer is a
new attempt).

**Task variables** and **thread variables** — the two places a chat keeps
variables, and not the same set. Task variables are attached by the queue when it
distributes the chat and live on the `Task`. Thread variables are set by bots and
flows during the chat and live behind REST on the thread. The Info tab shows both
(ADR-0006).

**Call variables** — the variables a flow exports onto a call, carried by the
call itself. Every call has them, task or not. A queue call's task also carries
the queue's distribution variables, but the Call window's Info tab shows only
the call variables (ADR-0009).

**End chat** — the agent's request to the backend to finish the task. It is
answered by post-processing starting, or by the task being released outright
when the queue has no post-processing.

**Close window** — dropping a chat from the workspace's open windows. Purely a
view concern: the thread and task carry on. Never a substitute for **End chat**.

**Outbound attempt** — one manual dial by the agent, from the request until the
callee answers or the agent closes it. Ringing and No answer are states of an
attempt. Several can run at once. It is not an **Active call**: when the callee
answers, the attempt ends and the call carries on in the active-call window.

**Active call** — a call that is connected, whichever side started it. Any number
can exist at once, one live and the rest on hold. Derived from the SDK's call
list; no store of its own.

**Blind transfer** — handing an Active call to a destination (a number, a user,
a queue, a dialplan) without speaking to it first. The agent is out of the call
the moment it is sent.

**Consult transfer** — handing an Active call to a destination (a number, an
agent, a queue) after speaking to it first: the original call is put on hold,
the agent places a **Consult call** to the destination, and then either bridges
the two or cancels the consult and goes back to the original call.

**Consult call** — the call to the destination of a Consult transfer, placed
while the original call is on hold. It is a call of its own, not the original;
once the destination answers it is an Active call like any other.

**Call window** — the central-area card for one call, the call's counterpart of
the chat window. It hosts the call while it is an **Active call** and stays on
through the call's **Post-processing** after hangup, until the agent leaves it or
the call's task is released (form submitted, deadline passed, or no
post-processing configured). A Call window is not an Active call: once the call
has hung up it is still a Call window, but no longer an Active call.
There is one per call, not per task: a call with no task (a manual dial, an
internal call) still has a Call window, just never a Post-processing phase.

It opens by itself only when the agent accepts an inbound **Offer** in this tab.
An outbound call the callee answers, a call picked up on a desk phone or in
another tab, and a call already connected when the page loads do not pull the
agent anywhere; they reach the window from the call dock.

**Return target** — where the agent was when they accepted the call: the screen
a Call window that opened by itself gives way to when it closes (task released,
or hangup for a call with no task). The agent is taken back only if they are
still on that Call window at that moment;
having left it, they stay where they are. A return target that no longer exists
(a chat since closed, a call since released) is not followed further back — the
agent lands on that section's list instead.

**Offer** — a chat or call that has been distributed to the agent and is waiting
for them to accept or decline. An offered chat is not in the agent's chat list
yet and the agent is not a member of its thread. It joins the list once
accepted.

**Offer card** — the incoming-interaction notification that presents an Offer in
the top-right corner. Calls and chats share one design.

**Chat preview** — one row of the chat list's Active tab: a chat the agent has
accepted, summarised before they open it. It shows who the client is, the
channel and queue, and the **Last message**. Opening it brings the chat into the
central panel, and the row of the chat currently open there is shown selected.

"Preview" on its own is ambiguous — say **Chat preview** for the list row and
**Offer card** for the notification. The SDK's `ThreadPreview` is its own name
for the summary carried on a task and is neither of these.

**Last message** — the newest message in a chat as the Chat preview shows it: its
text, when it was sent, and whether the agent or the client sent it. Kept for
every listed chat whether or not its window is open; it is not read from an open
chat's message history. The task carries a summary of its thread too, but only as
it was when the chat was distributed, and nothing refreshes it. It identifies the
thread, so the chats socket's events can be matched to the chat; its text and its
members are never shown or relied on, and a row shows no message until the first
read of the Last message answers.

**Unread chat** — a chat with client messages the agent has not read yet. A chat
counts as read once the agent has opened it and clicked its input field, not
merely opened it (AC_02.03.03). The chat list can be narrowed to unread chats.
The backend does not yet say how many unread messages a task's chat has, so no
chat is unread as far as the app can tell and the narrowing control stays out of
sight until it does — an unread state worked out on the client would read as
fact.

**Snoozed chat** — a chat the agent has set aside to wait for the client or for
themselves, with **Snooze** in its chat window. Not closed: the task and thread
carry on, and it still takes one of the agent's chat slots. The chat list has an
Active tab and a Snoozed tab, and a chat is on exactly one of them.

Snoozing is the agent's own: another agent in the same thread still sees it as
active. It ends by itself — there is no Unsnooze — when any message arrives that
the agent did not send (client, bot, another agent or a system message), which is
wider than "a new client message" in AC_02.02.05, or when the agent leaves the
thread (transfer, removal). Rejoining does not restore it. The chat backend keeps
it as a tag on the thread; the call-center side (the **Task**) knows nothing of it.

**Ended chat** — a chat whose interaction is over (the client closed it, it
timed out, or the agent sent **End chat**) while the agent is still a member of
its thread: in post-processing, or waiting to be dismissed. It stays on the
Active tab, marked with a lock and the reason it ended (AC_02.03.05–06), and
becomes a **Closed chat** once the agent leaves the thread — the task released,
or the agent dismissing it. The spec says "closed" for both; keep them apart.

**Closed chat** — a thread the agent was a member of and has left: the chat was
released after post-processing, transferred away, or the agent was removed. It
is the agent's own view, like a Snoozed chat: the client's chat may carry on
with another agent. An **Ended chat** is not closed yet, as the agent is still a
member. Nor is a thread the agent has
left and then joined again: while they are a member it is an active chat only,
and it becomes a Closed chat again when they next leave.

A thread is one Closed chat however many times the agent joined and left it.
Its card shows only the **Membership periods** the agent has closed in it, so
whatever the client wrote between two periods, or after the last, is not part of
it.

A Closed chat has no task, so its Info tab has thread variables only and says
that the task variables are not available, rather than looking as if there were
none.

**Reopen** — bringing a Closed chat back so the agent can write in it and the
client's reply comes back to them in the same thread (AC_04.01.06). The chat
backend cannot do this yet, so a Closed chat has no Reopen. Sending a message to
the client through a "via" (from the bot, fire-and-forget, the reply not routed
back to the agent) is a different thing and must not be called Reopen.

**Membership period** — one stretch of the agent's membership in a thread, from
joining to leaving. A transfer back to the same agent starts a new one.

A Closed chat's times are counted from its periods, not from the thread: it
started when the agent first joined (a bot may have run the thread long
before), ended when they last left, and its duration is the sum of its periods —
the time the agent had it, without the stretches it spent with someone else.
Its last message is the last one inside those periods.

**Tab indicator** — the badge beside a chat list tab's name. The grey one is the
number of chats on that tab. The green one, on Active only, is the number of
**Unread chats**, so it is hidden whenever the unread count is (AC_02.12.02). The
spec also has it vanish when the agent returns to the Active tab (AC_02.12.03);
that would be "new activity", not unread, and is deliberately not built.

_Avoid_ "conversation" for either: webitel-sdk uses `Conversation` for the older
chat model, which this app does not use.

## Conventions

### Test file naming

Unit tests (vitest) are `*.test.ts`, in a `__tests__/` folder next to the code
under test. End-to-end tests (Playwright) are `*.spec.ts` under `e2e/`, and
`*.live.spec.ts` for the ones that need a reachable instance.

The split is enforced by config rather than habit: `playwright.config.ts` picks
its projects with `testMatch: /(?<!\.live)\.spec\.ts$/` and
`/\.live\.spec\.ts$/`, so `.spec.ts` is Playwright's namespace. Vitest's default
include covers both suffixes and would silently adopt a `.spec.ts` placed under
`src/` — nothing fails, it just reads as a misplaced e2e.

`cc-workspaces` names its unit tests `*.spec.js`. Rename when porting from it.

### Commit messages

Conventional Commits, plus a link to the issue the work belongs to. The link
goes on its own line at the end of the body, above any trailers:

```
feat(chats): raise offers for incoming chats

<why, and what the reader could not infer from the diff>

[WS-19](https://webitel.atlassian.net/browse/WS-19)
```

Issues live in two projects: `WS` (Workspace 2.0) for this app's product work,
`WTEL` for everything else, including changes that originate here but land in
`webitel-ui-sdk`.

Nothing enforces this — git history predating the convention has no codes, and
most of it never will. The link is for the reader who arrives at a line via
`git blame` months later: the commit body says what and why, the issue says
what the product was asked for, and only one of those survives in Jira.
