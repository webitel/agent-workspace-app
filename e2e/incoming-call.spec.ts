import { callRingingFrame } from './fixtures/mocks';
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

	test('shows an offer for a ringing call and clears it on accept', async ({
		page,
		socket,
	}) => {
		test.setTimeout(60_000);

		await page.goto('calls');

		const card = page.locator('.incoming-interaction-preview');
		await expect(card).toHaveCount(0);

		socket.send('call', callRingingFrame());

		await expect(card).toBeVisible({
			timeout: 30_000,
		});
		await expect(card).toContainText('John Smith');
		await expect(card).toContainText('380671234678');
		await expect(card).toContainText('Support');

		// waiting time counts up from the call's start
		await expect(
			card.locator('.incoming-interaction-preview__waiting'),
		).toBeVisible();

		await card
			.getByRole('button', {
				name: 'Accept',
			})
			.click();

		await expect(card).toHaveCount(0);
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

		const card = page.locator('.incoming-interaction-preview');
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

		const card = page.locator('.incoming-interaction-preview');
		await expect(card).toBeVisible({
			timeout: 30_000,
		});
		await expect(card).toContainText('Unknown contact');
	});
});
