import type { Page } from '@playwright/test';

import { expect, test } from './fixtures/test';

/**
 * Drives `public/sw.js` directly: the worker's contract is a message protocol,
 * so the test speaks that protocol rather than going through a feature.
 *
 * The spec registers the worker itself. `useOsNotifications` has no consumer at
 * this point in the stack, so nothing in the app would bring one up — and the
 * worker file is the subject here, not the registration call. Registration is
 * covered separately, where the app actually performs it.
 *
 * Notifications created by a service worker are readable from the page through
 * `registration.getNotifications()`, which is how these assertions observe them
 * without a real OS notification surface.
 */

interface WorkerMessage {
	type: string;
	payload?: Record<string, unknown>;
}

async function postToWorker(page: Page, message: WorkerMessage) {
	await page.evaluate(async (data) => {
		const registration = await navigator.serviceWorker.ready;
		// deliberately not optional-chained: a dropped message would surface as an
		// empty notification list several seconds later, which is a miserable
		// failure to debug
		if (!registration.active) throw new Error('no active service worker');
		registration.active.postMessage(data);
	}, message);
}

async function closeAllNotifications(page: Page) {
	await page.evaluate(async () => {
		const registration = await navigator.serviceWorker.ready;
		const list = await registration.getNotifications();
		for (const notification of list) notification.close();
	});
}

async function openNotifications(page: Page) {
	return page.evaluate(async () => {
		const registration = await navigator.serviceWorker.ready;
		const list = await registration.getNotifications();
		return list.map((notification) => ({
			tag: notification.tag,
			title: notification.title,
			body: notification.body,
		}));
	});
}

const offer = (id: string, title = 'Incoming call request') => ({
	type: 'notification',
	payload: {
		id,
		title,
		body: 'John Smith: 380671234678',
		actions: [
			{
				action: 'accept',
				title: 'Accept',
			},
			{
				action: 'decline',
				title: 'Decline',
			},
		],
	},
});

/**
 * Runs in its own `service-worker` Playwright project, not in `mocked`, and must
 * run single-worker: `npm run test:e2e:sw`.
 *
 * A service worker registration and the notifications it creates are per-origin
 * browser state that Playwright does not isolate per test — unlike cookies or
 * localStorage, a fresh context does not get a fresh notification store. Across
 * parallel workers this spec failed roughly twice in twenty; serially it has
 * passed 20/20 repeatedly. `test.describe.configure({ mode: 'serial' })` is not
 * sufficient, because it orders tests within the group while still allowing
 * copies of the group to run concurrently.
 */
test.describe('notification service worker', () => {
	test.beforeEach(async ({ context, page }) => {
		await context.grantPermissions([
			'notifications',
		]);
		await page.goto('calls');
		await page.evaluate(async (base) => {
			// Start from a worker built from the sw.js on disk. A registration from
			// an earlier run can survive in the browser profile and keep controlling
			// the page, so the suite would silently assert against stale worker code.
			const existing = await navigator.serviceWorker.getRegistrations();
			await Promise.all(existing.map((one) => one.unregister()));

			await navigator.serviceWorker.register(`${base}sw.js`, {
				scope: base,
			});
			await navigator.serviceWorker.ready;

			// `ready` only guarantees an active worker, not one that has claimed
			// this page. On the very first registration the claim lands a tick
			// later, and messages posted before it are dropped on the floor.
			if (!navigator.serviceWorker.controller) {
				await new Promise((resolve) => {
					navigator.serviceWorker.addEventListener(
						'controllerchange',
						resolve,
						{
							once: true,
						},
					);
				});
			}
		}, '/agent-workspace/');

		await warmUpChannel(page);
	});

	/**
	 * Prove the page -> worker channel is live before asserting on it. Waiting for
	 * `controllerchange` is not sufficient on a cold profile: the first posted
	 * message can still land before the worker is listening, and the symptom is an
	 * empty notification list five seconds later.
	 */
	async function warmUpChannel(page: Page) {
		await expect
			.poll(
				async () => {
					await postToWorker(page, offer('warm-up', 'warm-up'));
					const open = await openNotifications(page);
					return open.some(({ tag }) => tag === 'warm-up');
				},
				{
					timeout: 15_000,
				},
			)
			.toBe(true);

		await closeAllNotifications(page);
		await expect
			.poll(async () => (await openNotifications(page)).length)
			.toBe(0);
	}

	test.afterEach(async ({ page }) => {
		await closeAllNotifications(page);
	});

	test('shows a notification tagged with the interaction id', async ({
		page,
	}) => {
		await postToWorker(page, offer('call-1'));

		await expect
			.poll(() => openNotifications(page))
			.toEqual([
				{
					tag: 'call-1',
					title: 'Incoming call request',
					body: 'John Smith: 380671234678',
				},
			]);
	});

	test('collapses repeat posts for one interaction into a single notification', async ({
		page,
	}) => {
		await postToWorker(page, offer('call-1'));
		await postToWorker(page, offer('call-1'));

		await expect
			.poll(async () => (await openNotifications(page)).length)
			.toBe(1);
	});

	test('closes only the notification for the given interaction', async ({
		page,
	}) => {
		await postToWorker(page, offer('call-1'));
		await postToWorker(page, offer('call-2', 'Incoming chat request'));
		await expect
			.poll(async () => (await openNotifications(page)).length)
			.toBe(2);

		await postToWorker(page, {
			type: 'close-notification',
			payload: {
				id: 'call-1',
			},
		});

		await expect
			.poll(async () => (await openNotifications(page)).map(({ tag }) => tag))
			.toEqual([
				'call-2',
			]);
	});

	/**
	 * A service worker receives messages from every client in its scope, so the
	 * payload is untrusted. A close with no id must not fall through to
	 * `getNotifications({ tag: undefined })`, which matches *every* notification.
	 */
	test('ignores malformed messages instead of closing everything', async ({
		page,
	}) => {
		await postToWorker(page, offer('call-1'));
		await postToWorker(page, offer('call-2'));
		await expect
			.poll(async () => (await openNotifications(page)).length)
			.toBe(2);

		await postToWorker(page, {
			type: 'close-notification',
		});
		await postToWorker(page, {
			type: 'close-notification',
			payload: {},
		});
		await postToWorker(page, {
			type: 'notification',
		});

		// give the worker a chance to mishandle them before asserting nothing moved
		await page.waitForTimeout(250);
		expect((await openNotifications(page)).length).toBe(2);
	});

	test('does not show a notification without a title', async ({ page }) => {
		await postToWorker(page, {
			type: 'notification',
			payload: {
				id: 'call-1',
			},
		});

		await page.waitForTimeout(250);
		expect(await openNotifications(page)).toEqual([]);
	});
});
