import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	drainGestureListeners,
	flush,
	installFakeWebAudio,
} from '../../../../../sound/utils/__tests__/fakeWebAudio';

/** Fresh module registry per test: the chirp caches its decoded buffer. */
async function loadChirp() {
	vi.resetModules();
	const { useOfferChirp } = await import('../useOfferChirp');
	return useOfferChirp();
}

describe('useOfferChirp', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.useFakeTimers();
	});

	afterEach(async () => {
		await drainGestureListeners();
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('plays once for an offer', async () => {
		const audio = installFakeWebAudio();
		const chirp = await loadChirp();

		chirp.play();
		await flush();

		expect(audio.sources).toHaveLength(1);
		expect(audio.sources[0].loop).toBe(false);
		expect(audio.sources[0].start).toHaveBeenCalledTimes(1);
	});

	it('plays again for a second offer rather than being one-shot forever', async () => {
		const audio = installFakeWebAudio();
		const chirp = await loadChirp();

		chirp.play();
		await flush();
		chirp.play();
		await flush();

		expect(audio.sources).toHaveLength(2);
	});

	it('chirps without a media element the OS media keys could reach', async () => {
		const audio = installFakeWebAudio();
		const chirp = await loadChirp();

		chirp.play();
		await flush();

		expect(audio.AudioElement).not.toHaveBeenCalled();
		expect(audio.mediaPlay).not.toHaveBeenCalled();
	});

	/** Several tabs each receive the event; only the first to claim makes a sound. */
	it('stays silent while another tab holds the chirp lock', async () => {
		const audio = installFakeWebAudio();
		localStorage.setItem(
			'wt/agent-workspace/sound-lock/chirp',
			JSON.stringify({
				tabId: 'another-tab',
				until: Date.now() + 60_000,
			}),
		);

		const chirp = await loadChirp();
		chirp.play();
		await flush();

		expect(audio.sources).toHaveLength(0);
	});

	/**
	 * A one-shot that took the ringtone's lock would cut a ring that happened to
	 * be running, and a ring would swallow every chirp behind it.
	 */
	it('does not take the ringtone lock', async () => {
		installFakeWebAudio();
		vi.resetModules();
		const { useOfferChirp } = await import('../useOfferChirp');
		const { SoundLockKind, useSoundLock } = await import('../useSoundLock');

		useOfferChirp().play();

		expect(useSoundLock(SoundLockKind.Ringtone, 60_000).acquire()).toBe(true);
	});

	/**
	 * A sibling Webitel app on this origin writes `currentTabId` on every load.
	 * Sharing that key is what muted this app for good.
	 */
	it('chirps even when another app owns the legacy tab slot', async () => {
		const audio = installFakeWebAudio();
		localStorage.setItem('currentTabId', '0.8222423407829396');

		const chirp = await loadChirp();
		chirp.play();
		await flush();

		expect(audio.sources).toHaveLength(1);
	});

	it('swallows a blocked autoplay instead of leaving it unhandled', async () => {
		installFakeWebAudio({
			canStart: false,
		});
		const chirp = await loadChirp();

		expect(() => chirp.play()).not.toThrow();
		// let the rejection settle; an unhandled one fails the suite
		await vi.advanceTimersByTimeAsync(300);
		await flush();
	});

	it('survives a failed load', async () => {
		const audio = installFakeWebAudio();
		audio.fetchMock.mockRejectedValue(new Error('offline'));
		const chirp = await loadChirp();

		expect(() => chirp.play()).not.toThrow();
		await flush();
	});
});
