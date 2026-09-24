import { expect, test } from './fixtures/test';

test.describe('dark mode switcher', () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.removeItem('theme');
			document.documentElement.classList.remove('theme--dark');
		});
	});

	test('toggles theme--dark on html and persists theme', async ({ page }) => {
		test.setTimeout(60_000);

		await page.goto('calls');

		const switcher = page.locator('.wt-dark-mode-switcher');
		await expect(switcher).toBeVisible({
			timeout: 30_000,
		});

		const html = page.locator('html');
		await expect(html).not.toHaveClass(/theme--dark/);

		await switcher.locator('.wt-switcher').click();
		await expect(html).toHaveClass(/theme--dark/);
		await expect
			.poll(async () => page.evaluate(() => localStorage.getItem('theme')))
			.toBe('dark');

		await switcher.locator('.wt-switcher').click();
		await expect(html).not.toHaveClass(/theme--dark/);
		await expect
			.poll(async () => page.evaluate(() => localStorage.getItem('theme')))
			.toBe('light');
	});
});
