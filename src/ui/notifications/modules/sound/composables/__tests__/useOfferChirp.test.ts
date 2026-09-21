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

	/** Several tabs each receive the event; only the first to claim makes a sound. */
	it('stays silent while another tab holds the chirp lock', async () => {
		const media = stubMediaElement();
		localStorage.setItem(
			'wt/agent-workspace/sound-lock/chirp',
			JSON.stringify({
				tabId: 'another-tab',
				until: Date.now() + 60_000,
			}),
		);

		const chirp = await loadChirp();
		chirp.play();

		expect(media.play).not.toHaveBeenCalled();
	});

	/**
	 * A one-shot that took the ringtone's lock would cut a ring that happened to
	 * be running, and a ring would swallow every chirp behind it.
	 */
	it('does not take the ringtone lock', async () => {
		stubMediaElement();
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
		const media = stubMediaElement();
		localStorage.setItem('currentTabId', '0.8222423407829396');

		const chirp = await loadChirp();
		chirp.play();

		expect(media.play).toHaveBeenCalledTimes(1);
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
