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

## CI

`.github/workflows/e2e.yml` runs the `mocked` project on every pull request and
uploads the HTML report as an artifact. `live` is deliberately not in CI: it
would need `E2E_ACCESS_TOKEN` as a repo secret and would fail whenever the test
instance is down or mid-deploy. Run it locally before touching bootstrap, auth
or the API layer.

## Driving tasks from the socket

`mockAppWebSocket` answers every request and records it in `socket.requests`, so
a spec can assert what the app sent (e.g. `cc_form_action`). Server-initiated
frames go out through `socket.send(event, data, channel)`:

- calls — `call` frames (`callRingingFrame`, `callHangupFrame`);
- chat tasks — `channel` frames (`chatTaskFrame(status, …)` with
  `chatDistribute()` for `distribute`), stepping a task through `distribute`,
  `bridged`, `form`, `processing` and `wrap_time`. `mockChatThread` stubs the
  thread and history reads the chat window makes when opened.

The SDK ignores `channel` frames until the agent session exists, and frames sent
before the socket connects are flushed right after `hello` — too early. Wait for
the header's status select (`combobox "Online"`) before pushing task frames.

## Known gap

`GET /api/user-status` does not exist on `test.webitel.me` yet, and app
bootstrap aborts on its failure. `e2e/fixtures/live.ts` substitutes a response
only while the real endpoint returns 404, so the patch lapses by itself once the
instance catches up.
