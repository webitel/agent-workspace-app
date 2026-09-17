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
