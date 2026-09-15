# End-to-end tests

Playwright specs live in `e2e/`. They run in two projects, both Chromium.

| project | specs | backend | token |
|---|---|---|---|
| `mocked` | `*.spec.ts` | every call intercepted in `e2e/fixtures/mocks.ts` | fake |
| `live` | `*.live.spec.ts` | the instance in `.env.e2e` | real, required |

```sh
npm run test:e2e        # mocked only — the CI default
npm run test:e2e:live   # real instance
npm run test:e2e:ui     # both, in Playwright's UI mode
```

## Authorization

There is no login form to drive. `src/app/router/index.ts` redirects to
`VITE_AUTH_URL` when `localStorage['access-token']` is missing, and every API
call reads that same key, so seeding it is the whole of "being logged in":

- `mocked` seeds a dummy token in `e2e/fixtures/test.ts`.
- `live` seeds a real one through the project's `storageState`, built in
  `playwright.config.ts` from `E2E_ACCESS_TOKEN`.

Copy `.env.e2e.local.example` to `.env.e2e.local` (gitignored) and paste a
long-lived token for the instance in `.env.e2e`. Without it the `live` specs
skip with a message; `mocked` is unaffected. CI supplies the same variable as a
secret.

## Environment

Both projects run the app under vite's `e2e` mode, so they read `.env.e2e`
(committed) rather than whatever `.env.development.local` happens to point at,
and they use their own port so they never reuse a dev server started by hand.

`.env.e2e` sends the app at same-origin `/api`, which `vite.config.ts` proxies
to `E2E_API_ORIGIN` — the instance rejects CORS preflights from `localhost`, so
the live tests need the proxy to get past app bootstrap.

## Known gap

`GET /api/user-status` does not exist on `test.webitel.me` yet, and app
bootstrap aborts on its failure. `e2e/fixtures/live.ts` substitutes a response
only while the real endpoint returns 404, so the patch lapses by itself once the
instance catches up.
