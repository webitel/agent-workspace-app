import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

/**
 * E2E env comes from the `e2e` vite mode: `.env.e2e` (committed, points at the
 * test instance) plus `.env.e2e.local` (gitignored, holds the access token).
 * Reusing vite's loader keeps the config and the dev server on the same values
 * without pulling in dotenv.
 */
const env = loadEnv('e2e', process.cwd(), '');

const accessToken = env.E2E_ACCESS_TOKEN;

/* Re-exported so the `live` fixture can skip with a reason instead of failing. */
process.env.E2E_ACCESS_TOKEN = accessToken ?? '';

const port = process.env.CI ? 4173 : 5273;
const origin = `http://localhost:${port}`;

export default defineConfig({
	testDir: './e2e',
	/* Maximum time one test can run for. */
	timeout: 30 * 1000,
	expect: {
		/**
		 * Maximum time expect() should wait for the condition to be met.
		 * For example in `await expect(locator).toHaveText();`
		 */
		timeout: 5000,
	},
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
		actionTimeout: 0,
		/**
		 * The app is served under `/agent-workspace`. Keep the trailing slash:
		 * specs navigate with relative paths (`page.goto('calls')`), and a
		 * root-relative `/calls` would drop the base path.
		 */
		baseURL: `${origin}/agent-workspace/`,

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',

		/* Only on CI systems run the tests headless */
		headless: !!process.env.CI,
	},

	projects: [
		/**
		 * Hermetic: every backend call is intercepted (see `e2e/fixtures`), so
		 * these need no token and no reachable instance.
		 */
		{
			name: 'mocked',
			testMatch: /(?<!\.live)\.spec\.ts$/,
			use: {
				...devices['Desktop Chrome'],
			},
		},
		/**
		 * Hits the real instance from `.env.e2e` with a long-lived token seeded
		 * into localStorage, which is all the router guard checks for.
		 * Without a token the project still exists, but its tests skip.
		 */
		{
			name: 'live',
			testMatch: /\.live\.spec\.ts$/,
			use: {
				...devices['Desktop Chrome'],
				storageState: {
					cookies: [],
					origins: accessToken
						? [
								{
									origin,
									localStorage: [
										{
											name: 'access-token',
											value: accessToken,
										},
									],
								},
							]
						: [],
				},
			},
		},
	],

	webServer: {
		command: process.env.CI
			? `npm run build -- --mode e2e && npm run preview -- --mode e2e --port ${port}`
			: `npm run dev -- --mode e2e --port ${port} --strictPort`,
		port,
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},
});
