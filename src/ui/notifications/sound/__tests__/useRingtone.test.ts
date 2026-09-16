import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** jsdom doesn't implement media playback, so drive the element through spies. */
function stubMediaElement() {
	const play = vi
		.spyOn(HTMLMediaElement.prototype, 'play')
		.mockImplementation(function (this: HTMLMediaElement) {
			Object.defineProperty(this, 'paused', {
				value: false,
				configurable: true,
			});
			return Promise.resolve();
		});
	const pause = vi
		.spyOn(HTMLMediaElement.prototype, 'pause')
		.mockImplementation(function (this: HTMLMediaElement) {
			Object.defineProperty(this, 'paused', {
				value: true,
				configurable: true,
			});
		});
	return {
		play,
		pause,
	};
}

async function loadRingtone() {
	vi.resetModules();
	const { useRingtone } = await import('../useRingtone');
	return useRingtone();
}

describe('useRingtone', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('starts and stops the loop', async () => {
		const media = stubMediaElement();
		const ringtone = await loadRingtone();

		ringtone.start();
		expect(media.play).toHaveBeenCalled();

		ringtone.stop();
		expect(media.pause).toHaveBeenCalled();
	});

	it('does not start a second loop while already ringing', async () => {
		const media = stubMediaElement();
		const ringtone = await loadRingtone();

		ringtone.start();
		ringtone.start();

		expect(media.play).toHaveBeenCalledTimes(1);
	});

	/**
	 * `{ once: true }` only removes the listener that fired, so after a pointer
	 * gesture the keydown listener survives — and priming again mid-ring pauses
	 * the ringtone. An agent typing during an offer would silence it.
	 */
	it('keeps ringing when a second input modality is used after priming', async () => {
		const media = stubMediaElement();
		const ringtone = await loadRingtone();

		// first gesture primes the element
		window.dispatchEvent(new Event('pointerdown'));
		await Promise.resolve();

		ringtone.start();
		expect(media.play).toHaveBeenCalled();
		media.pause.mockClear();

		// agent types while the offer is ringing
		window.dispatchEvent(new Event('keydown'));
		await Promise.resolve();
		await Promise.resolve();

		expect(media.pause).not.toHaveBeenCalled();
	});

	it('primes only once regardless of how many gestures arrive', async () => {
		const media = stubMediaElement();
		await loadRingtone();

		window.dispatchEvent(new Event('pointerdown'));
		await Promise.resolve();
		const afterFirst = media.play.mock.calls.length;

		window.dispatchEvent(new Event('keydown'));
		window.dispatchEvent(new Event('pointerdown'));
		await Promise.resolve();

		expect(media.play.mock.calls.length).toBe(afterFirst);
	});
});
