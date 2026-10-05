import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	drainGestureListeners,
	flush,
	installFakeWebAudio,
} from '../../../../../sound/utils/__tests__/fakeWebAudio';

async function loadRingtone() {
	vi.resetModules();
	const { useRingtone } = await import('../useRingtone');
	return useRingtone();
}

describe('useRingtone', () => {
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

	it('starts and stops the loop', async () => {
		const audio = installFakeWebAudio();
		const ringtone = await loadRingtone();

		ringtone.start();
		await flush();
		expect(audio.sources).toHaveLength(1);
		expect(audio.sources[0].loop).toBe(true);
		expect(audio.sources[0].start).toHaveBeenCalledTimes(1);

		ringtone.stop();
		expect(audio.sources[0].stop).toHaveBeenCalledTimes(1);
	});

	it('does not start a second loop while already ringing', async () => {
		const audio = installFakeWebAudio();
		const ringtone = await loadRingtone();

		ringtone.start();
		ringtone.start();
		await flush();

		expect(audio.sources).toHaveLength(1);
	});

	/**
	 * A played media element becomes the OS's Now Playing source, and the
	 * Play/Pause key on macOS then restarts it: music key presses rang the phone.
	 */
	it('rings without a media element the OS media keys could reach', async () => {
		const audio = installFakeWebAudio();
		const ringtone = await loadRingtone();

		ringtone.start();
		await flush();
		ringtone.stop();

		expect(audio.AudioElement).not.toHaveBeenCalled();
		expect(audio.mediaPlay).not.toHaveBeenCalled();
	});

	/** Typing during an offer must not silence it. */
	it('keeps ringing when a second input modality is used after the first', async () => {
		const audio = installFakeWebAudio();
		const ringtone = await loadRingtone();

		window.dispatchEvent(new Event('pointerdown'));
		await flush();
		ringtone.start();
		await flush();

		window.dispatchEvent(new Event('keydown'));
		await flush();

		expect(audio.sources[0].stop).not.toHaveBeenCalled();
	});

	it('lets a later offer try again once autoplay was blocked', async () => {
		const audio = installFakeWebAudio({
			canStart: false,
		});
		const ringtone = await loadRingtone();

		ringtone.start();
		await vi.advanceTimersByTimeAsync(300);
		await flush();
		const attempts = audio.contexts[0].resume.mock.calls.length;

		// the lock was released, so this is not swallowed as "already ringing"
		ringtone.start();
		await vi.advanceTimersByTimeAsync(300);
		await flush();

		expect(audio.contexts[0].resume.mock.calls.length).toBeGreaterThan(
			attempts,
		);
	});
});
