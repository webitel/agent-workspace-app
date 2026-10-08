import { callHangupFrame, callRingingFrame } from './fixtures/mocks';
import { expect, test } from './fixtures/test';

/**
 * Covers the wiring no unit test reaches: SDK `subscribeCall` -> derived offer
 * list -> notifications module -> DOM, and back out through Accept.
 */
test.describe('incoming call notification', () => {
	test.beforeEach(async ({ page, context }) => {
		// the answer path gates on getUserMedia; the OS notification path asks for
		// permission on first gesture
		await context.grantPermissions([
			'microphone',
			'notifications',
		]);

		// `allowAnswer` requires the SDK to have built a phone, which only happens
		// when the web device is registered
		await page.addInitScript(() => {
			localStorage.setItem(
				'CONFIG',
				JSON.stringify({
					CLI: {
						registerWebDevice: true,
					},
				}),
			);
		});
	});

	/**
	 * A played media element becomes the OS's Now Playing source, and on macOS the
	 * Play/Pause key then resumes it: pressing play for music started the ring. The
	 * ring has to come from Web Audio, which the media keys cannot reach.
	 */
	test('rings through Web Audio and never plays a media element', async ({
		page,
		socket,
	}) => {
		test.setTimeout(60_000);

		await page.addInitScript(() => {
			const counts = {
				mediaPlays: 0,
				sourceStarts: 0,
				sourceStops: 0,
			};
			(
				window as unknown as {
					__sound: typeof counts;
				}
			).__sound = counts;

			const play = HTMLMediaElement.prototype.play;
			HTMLMediaElement.prototype.play = function (...args) {
				counts.mediaPlays += 1;
				return play.apply(this, args);
			};
			const start = AudioBufferSourceNode.prototype.start;
			AudioBufferSourceNode.prototype.start = function (...args) {
				counts.sourceStarts += 1;
				return start.apply(this, args);
			};
			const stop = AudioBufferSourceNode.prototype.stop;
			AudioBufferSourceNode.prototype.stop = function (...args) {
				counts.sourceStops += 1;
				return stop.apply(this, args);
			};
		});
		const sound = () =>
			page.evaluate(
				() =>
					(
						window as unknown as {
							__sound: {
								mediaPlays: number;
								sourceStarts: number;
								sourceStops: number;
							};
						}
					).__sound,
			);

		await page.goto('calls');
		// browsers start audio only after a gesture
		await page.mouse.click(5, 5);

		socket.send('call', callRingingFrame());
		await expect(page.locator('.offer-card')).toBeVisible({
			timeout: 30_000,
		});

		await expect.poll(async () => (await sound()).sourceStarts).toBe(1);

		socket.send('call', callHangupFrame());
		await expect(page.locator('.offer-card')).toHaveCount(0);

		await expect
			.poll(async () => (await sound()).sourceStops)
			.toBeGreaterThan(0);
		expect((await sound()).mediaPlays).toBe(0);
	});

	test('shows an offer for a ringing call and clears it when the call ends', async ({
		page,
		socket,
	}) => {
		test.setTimeout(60_000);

		await page.goto('calls');

		const card = page.locator('.offer-card');
		await expect(card).toHaveCount(0);

		socket.send('call', callRingingFrame());

		await expect(card).toBeVisible({
			timeout: 30_000,
		});
		await expect(card).toContainText('John Smith');
		await expect(card).toContainText('380671234678');
		await expect(card).toContainText('Support');

		// waiting time counts up from the call's start
		await expect(card.locator('.offer-waiting-time')).toBeVisible();

		/*
		 * Accepting must not remove the card on its own. The offer is derived
		 * from the SDK's call list, and `answer()` can return without reaching
		 * the SDK at all — a denied microphone does exactly that. Dismissing on
		 * click left the agent with a call that was still ringing and no longer
		 * visible.
		 */
		await card
			.getByRole('button', {
				name: 'Accept',
			})
			.click();

		await expect(card).toBeVisible();

		// only the call leaving the SDK's list takes the card away
		socket.send('call', callHangupFrame());

		await expect(card).toHaveCount(0);
	});

	/**
	 * Registration is the app's job, not the worker's, so it is covered here
	 * rather than in the service worker spec — this is the first point in the
	 * stack where something actually calls `useOsNotifications.initialize()`.
	 *
	 * Regression: vite's `base` has no trailing slash, and a worker at
	 * `<base>/sw.js` can only claim `<base>/`. Registering with the bare base
	 * failed with a SecurityError on every load and went unnoticed.
	 */
	test('registers the notification service worker under the app base path', async ({
		page,
	}) => {
		test.setTimeout(60_000);

		await page.goto('calls');

		const registration = await page.evaluate(async () => {
			const reg = await navigator.serviceWorker.ready;
			return {
				scope: reg.scope,
				hasActive: !!reg.active,
			};
		});

		expect(registration.scope).toContain('/agent-workspace/');
		expect(registration.hasActive).toBe(true);
	});

	test('masks the number when the call hides it', async ({ page, socket }) => {
		test.setTimeout(60_000);

		await page.goto('calls');

		socket.send(
			'call',
			callRingingFrame({
				id: 'e2e-call-masked',
				hideNumber: true,
			}),
		);

		const card = page.locator('.offer-card');
		await expect(card).toBeVisible({
			timeout: 30_000,
		});
		await expect(card).toContainText('*****678');
		await expect(card).not.toContainText('380671234678');
	});

	test('falls back to Unknown contact when the caller is not identified', async ({
		page,
		socket,
	}) => {
		test.setTimeout(60_000);

		await page.goto('calls');

		socket.send(
			'call',
			callRingingFrame({
				id: 'e2e-call-unknown',
				// the platform echoes the number as the name when nothing identifies
				// the caller, which `displayName` normalises to ''
				name: '380671234678',
			}),
		);

		const card = page.locator('.offer-card');
		await expect(card).toBeVisible({
			timeout: 30_000,
		});
		await expect(card).toContainText('Unknown contact');
	});
});
