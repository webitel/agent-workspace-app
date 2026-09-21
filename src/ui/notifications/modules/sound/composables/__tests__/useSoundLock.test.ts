import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SoundLockKind } from '../useSoundLock';

const RINGTONE = 'ringtone' as SoundLockKind;
const CHIRP = 'chirp' as SoundLockKind;
const TTL = 30_000;

/**
 * Each `import()` after `resetModules` gets a fresh module-level tab id, which
 * is how we model a second browser tab sharing one localStorage.
 */
async function loadTab(kind: SoundLockKind = RINGTONE, ttlMs = TTL) {
	vi.resetModules();
	const { useSoundLock } = await import('../useSoundLock');
	return useSoundLock(kind, ttlMs);
}

describe('useSoundLock', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-09-21T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('lets the first tab take the lock', async () => {
		const firstTab = await loadTab();

		expect(firstTab.acquire()).toBe(true);
		expect(firstTab.isHeldByThisTab()).toBe(true);
	});

	it('keeps a second tab silent while the first holds the lock', async () => {
		const firstTab = await loadTab();
		firstTab.acquire();

		const secondTab = await loadTab();

		expect(secondTab.acquire()).toBe(false);
		expect(secondTab.isHeldByThisTab()).toBe(false);
	});

	// the ringtone renews while it plays; only `isHeldByThisTab` says "already ringing"
	it('lets the holder renew its own lock', async () => {
		const firstTab = await loadTab();

		expect(firstTab.acquire()).toBe(true);
		expect(firstTab.acquire()).toBe(true);
	});

	it('releases the lock so it can be taken again', async () => {
		const firstTab = await loadTab();

		firstTab.acquire();
		firstTab.release();

		expect(firstTab.isHeldByThisTab()).toBe(false);

		const secondTab = await loadTab();
		expect(secondTab.acquire()).toBe(true);
	});

	it('never clears a lock owned by another live tab', async () => {
		const firstTab = await loadTab();
		firstTab.acquire();

		const secondTab = await loadTab();
		secondTab.release();

		expect(firstTab.isHeldByThisTab()).toBe(true);
	});

	// a crashed tab never runs its unload handler; the app must not go mute
	it('takes over a lock left behind by a crashed tab', async () => {
		const crashedTab = await loadTab();
		crashedTab.acquire();

		vi.advanceTimersByTime(TTL + 1);

		const newTab = await loadTab();

		expect(newTab.acquire()).toBe(true);
	});

	it('holds the lock for its full lifetime', async () => {
		const firstTab = await loadTab();
		firstTab.acquire();

		vi.advanceTimersByTime(TTL - 1);

		const secondTab = await loadTab();
		expect(secondTab.acquire()).toBe(false);
	});

	// the ring and the chirp must not silence one another
	it('keeps each sound class on its own lock', async () => {
		const ringingTab = await loadTab(RINGTONE);
		ringingTab.acquire();

		vi.resetModules();
		const { useSoundLock } = await import('../useSoundLock');

		expect(useSoundLock(CHIRP, TTL).acquire()).toBe(true);
	});

	/**
	 * ui-sdk's Vuex notifications module writes `currentTabId` unconditionally
	 * on load, and every Webitel app shares this origin. Owning that key is what
	 * let the admin panel or the CRM mute this app for good.
	 */
	it('ignores the legacy cross-app keys', async () => {
		localStorage.setItem('currentTabId', '0.8222423407829396');
		localStorage.setItem('wtIsPlaying', 'true');

		const tab = await loadTab();

		expect(tab.acquire()).toBe(true);
		expect(localStorage.getItem('currentTabId')).toBe('0.8222423407829396');
		expect(localStorage.getItem('wtIsPlaying')).toBe('true');
	});

	it('frees every lock this tab holds on unload', async () => {
		vi.resetModules();
		const { useSoundLock, releaseSoundLocks } = await import('../useSoundLock');
		useSoundLock(RINGTONE, TTL).acquire();
		useSoundLock(CHIRP, TTL).acquire();

		releaseSoundLocks();

		const newTab = await loadTab(RINGTONE);
		expect(newTab.acquire()).toBe(true);
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

		expect(tab.acquire()).toBe(true);

		getItem.mockRestore();
		setItem.mockRestore();
	});
});
