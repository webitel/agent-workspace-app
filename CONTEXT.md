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

A processing form can exist without post-processing (it arrived mid-chat), and
post-processing without a form falls back to plain reporting. The chat window's
tab is labelled "Post-processing" by design, but it hosts the processing form
whenever one exists.

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
