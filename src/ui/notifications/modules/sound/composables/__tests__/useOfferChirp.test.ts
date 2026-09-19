import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** jsdom does not implement media playback, so drive the element through spies. */
function stubMediaElement(playImpl?: () => Promise<void> | undefined) {
	return {
		play: vi
			.spyOn(HTMLMediaElement.prototype, 'play')
			.mockImplementation(
				playImpl ?? (() => Promise.resolve() as unknown as Promise<void>),
			),
		pause: vi
			.spyOn(HTMLMediaElement.prototype, 'pause')
			.mockImplementation(() => {}),
	};
}

/** Fresh module registry per test: the chirp caches one audio element. */
async function loadChirp() {
	vi.resetModules();
	const { useOfferChirp } = await import('../useOfferChirp');
	return useOfferChirp();
}

describe('useOfferChirp', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('plays once for an offer', async () => {
		const media = stubMediaElement();
		const chirp = await loadChirp();

		chirp.play();

		expect(media.play).toHaveBeenCalledTimes(1);
	});

	it('plays again for a second offer rather than being one-shot forever', async () => {
		const media = stubMediaElement();
		const chirp = await loadChirp();

		chirp.play();
		chirp.play();

		expect(media.play).toHaveBeenCalledTimes(2);
	});

	/** Several tabs each receive the event; only the main one makes a sound. */
	it('stays silent in a tab that does not own the main slot', async () => {
		const media = stubMediaElement();
		localStorage.setItem('currentTabId', 'another-tab');

		const chirp = await loadChirp();
		chirp.play();

		expect(media.play).not.toHaveBeenCalled();
	});

	/**
	 * The lock means "a loop owns the sound channel". A one-shot that took it
	 * would silence the next chat and, on release, cut a running ringtone.
	 */
	it('does not take the exclusive sound lock', async () => {
		stubMediaElement();
		vi.resetModules();
		const { useOfferChirp } = await import('../useOfferChirp');
		const { useSoundLock } = await import('../useSoundLock');

		useOfferChirp().play();

		expect(useSoundLock().acquire()).toBe(true);
	});

	it('swallows a rejected play instead of leaving it unhandled', async () => {
		stubMediaElement(() => Promise.reject(new Error('autoplay blocked')));
		const chirp = await loadChirp();

		expect(() => chirp.play()).not.toThrow();
		// let the rejection settle; an unhandled one fails the suite
		await Promise.resolve();
		await Promise.resolve();
	});

	it('survives a play() that throws synchronously', async () => {
		stubMediaElement(() => {
			throw new Error('no output device');
		});
		const chirp = await loadChirp();

		expect(() => chirp.play()).not.toThrow();
		await Promise.resolve();
		await Promise.resolve();
	});
});
