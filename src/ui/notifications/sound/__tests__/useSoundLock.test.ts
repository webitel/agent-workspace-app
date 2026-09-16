import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Each `import()` after `resetModules` gets a fresh module-level tab id, which
 * is how we model a second browser tab sharing one localStorage.
 */
async function loadTab() {
	vi.resetModules();
	const { useSoundLock } = await import('../useSoundLock');
	return useSoundLock();
}

describe('useSoundLock', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-09-16T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('lets the first tab acquire the lock', async () => {
		const firstTab = await loadTab();

		expect(firstTab.isMainTab()).toBe(true);
		expect(firstTab.acquire()).toBe(true);
		expect(firstTab.isHeldByThisTab()).toBe(true);
	});

	it('does not let one tab start a second sound on top of its own', async () => {
		const firstTab = await loadTab();

		expect(firstTab.acquire()).toBe(true);
		expect(firstTab.acquire()).toBe(false);
	});

	it('keeps a second tab silent while the first owns the slot', async () => {
		const firstTab = await loadTab();
		firstTab.acquire();

		const secondTab = await loadTab();

		expect(secondTab.isMainTab()).toBe(false);
		expect(secondTab.acquire()).toBe(false);
	});

	it('releases the lock so it can be taken again', async () => {
		const firstTab = await loadTab();

		firstTab.acquire();
		firstTab.release();

		expect(firstTab.isHeldByThisTab()).toBe(false);
		expect(firstTab.acquire()).toBe(true);
	});

	// a crashed tab never runs its unload handler; the app must not go mute
	it('takes over a lock left behind by a crashed tab', async () => {
		const crashedTab = await loadTab();
		crashedTab.acquire();

		localStorage.removeItem('currentTabId'); // crashed tab freed nothing
		vi.advanceTimersByTime(3 * 60 * 1000);

		const newTab = await loadTab();

		expect(newTab.isMainTab()).toBe(true);
		expect(newTab.acquire()).toBe(true);
	});

	it('never clears a lock owned by another live tab', async () => {
		const firstTab = await loadTab();
		firstTab.acquire();

		const secondTab = await loadTab();
		secondTab.release();

		expect(firstTab.isHeldByThisTab()).toBe(true);
	});

	it('still allows sound when storage is unavailable', async () => {
		const getItem = vi
			.spyOn(Storage.prototype, 'getItem')
			.mockImplementation(() => {
				throw new Error('blocked');
			});
		const setItem = vi
			.spyOn(Storage.prototype, 'setItem')
			.mockImplementation(() => {
				throw new Error('blocked');
			});

		const tab = await loadTab();

		expect(tab.isMainTab()).toBe(true);
		expect(tab.acquire()).toBe(true);

		getItem.mockRestore();
		setItem.mockRestore();
	});
});
