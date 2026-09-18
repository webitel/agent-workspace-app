# agent-workspace-app

Operator (agent) workspace, built on the current frontend stack: Vue 3 +
Pinia, Vite, Biome, vitest and Playwright. Served under the `/agent-workspace`
base path.

Not to be confused with `cc-workspaces`, the previous-generation operator
workspace. Logic is regularly ported across from it; its conventions are older
and should not be carried over wholesale.

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
