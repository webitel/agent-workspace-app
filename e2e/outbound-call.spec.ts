import { callHangupFrame, outboundCallRingingFrame } from './fixtures/mocks';
import { expect, test } from './fixtures/test';

/**
 * @author Oleksandr Palonnyi
 * Covers the wiring no unit test reaches (US_16.01): numpad -> `client.call`
 * -> SDK `Ringing` -> outbound call card -> `Hangup` / `Destroy` -> No answer.
 * The web device stays unregistered, so `client.call` goes out as a socket
 * request the mock acknowledges instead of a SIP INVITE it cannot answer.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
test.describe('outbound call', () => {
	test.beforeEach(async ({ page, context }) => {
		await context.grantPermissions([
			'microphone',
		]);
		await page.addInitScript(() => {
			localStorage.setItem(
				'CONFIG',
				JSON.stringify({
					CLI: {
						registerWebDevice: false,
					},
				}),
			);
		});
	});

	async function dialFromNumpad(
		page: import('@playwright/test').Page,
		number: string,
	) {
		await page.goto('calls');
		await page.locator('.the-workspace-nav__group--bottom button').click();
		const input = page.locator('.the-numpad input');
		await input.fill(number);
		await input.press('Enter');
	}

	test('replaces the numpad with the ringing card and follows the call', async ({
		page,
		socket,
	}) => {
		test.setTimeout(60_000);

		await dialFromNumpad(page, '+1 202 341 7842');

		const card = page.locator('.outbound-call-card');
		await expect(page.locator('.the-numpad')).toHaveCount(0);
		await expect(card).toBeVisible();
		await expect(card).toContainText('+1 202 341 7842');
		await expect(card.locator('.ringing-indicator')).toBeVisible();

		socket.send('call', outboundCallRingingFrame());

		await expect(card).toContainText('Emily Johnson');
		await expect(card).toContainText('+12023417842');
	});

	test('shows no answer and goes back to the dialpad with the number', async ({
		page,
		socket,
	}) => {
		test.setTimeout(60_000);

		await dialFromNumpad(page, '+12023417842');
		socket.send('call', outboundCallRingingFrame());
		const card = page.locator('.outbound-call-card');
		await expect(card).toContainText('Emily Johnson');

		socket.send('call', callHangupFrame());

		await expect(card).toContainText('No answer');
		await expect(
			card.getByRole('button', {
				name: 'Retry call',
			}),
		).toBeVisible();

		await card
			.getByRole('button', {
				name: 'Back to dialpad',
			})
			.click();

		await expect(card).toHaveCount(0);
		await expect(page.locator('.the-numpad input')).toHaveValue('+12023417842');
	});

	test('closes the card when the agent hangs up while ringing', async ({
		page,
		socket,
	}) => {
		test.setTimeout(60_000);

		await dialFromNumpad(page, '+12023417842');
		socket.send('call', outboundCallRingingFrame());
		const card = page.locator('.outbound-call-card');
		await expect(card).toContainText('Emily Johnson');

		await card.locator('.wt-icon-btn').last().click();

		await expect(card).toHaveCount(0);
	});
});
