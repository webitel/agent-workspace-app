import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	drainGestureListeners,
	flush,
	installFakeWebAudio,
} from './fakeWebAudio';

async function load() {
	vi.resetModules();
	return import('../createSound');
}

describe('createSound', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(async () => {
		await drainGestureListeners();
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('plays through a buffer source connected to the output', async () => {
		const audio = installFakeWebAudio();
		const { createSound } = await load();

		const sound = createSound('/ring.mp3', {
			loop: true,
		});
		const playing = sound.play();
		await flush();
		await playing;

		const [source] = audio.sources;
		expect(source.loop).toBe(true);
		expect(source.connect).toHaveBeenCalledWith(audio.contexts[0].destination);
		expect(source.start).toHaveBeenCalledTimes(1);
	});

	/**
	 * A played `HTMLAudioElement` registers as the page's Now Playing source, and
	 * on macOS the Play/Pause key then resumes it: the agent's music key press
	 * starts the ringtone.
	 */
	it('never touches a media element, which the OS media keys could reach', async () => {
		const audio = installFakeWebAudio();
		const { createSound } = await load();

		const sound = createSound('/ring.mp3', {
			loop: true,
		});
		const playing = sound.play();
		await flush();
		await playing;
		sound.stop();

		expect(audio.AudioElement).not.toHaveBeenCalled();
		expect(audio.mediaPlay).not.toHaveBeenCalled();
	});

	it('rejects when the browser keeps the context blocked', async () => {
		installFakeWebAudio({
			canStart: false,
		});
		const { createSound } = await load();

		const playing = createSound('/ring.mp3').play();
		const settled = expect(playing).rejects.toThrow('blocked');
		await vi.advanceTimersByTimeAsync(300);

		await settled;
	});

	it('stops the source', async () => {
		const audio = installFakeWebAudio();
		const { createSound } = await load();
		const sound = createSound('/ring.mp3');
		const playing = sound.play();
		await flush();
		await playing;

		sound.stop();

		expect(audio.sources[0].stop).toHaveBeenCalledTimes(1);
	});

	it('restarts rather than layering a second source on the first', async () => {
		const audio = installFakeWebAudio();
		const { createSound } = await load();
		const sound = createSound('/chirp.wav');

		for (let i = 0; i < 2; i += 1) {
			const playing = sound.play();
			await flush();
			await playing;
		}

		expect(audio.sources).toHaveLength(2);
		expect(audio.sources[0].stop).toHaveBeenCalledTimes(1);
		expect(audio.sources[1].stop).not.toHaveBeenCalled();
	});

	/** An offer resolving while the sound is still decoding must not ring after. */
	it('does not start when stopped while still loading', async () => {
		const audio = installFakeWebAudio();
		const { createSound } = await load();
		const sound = createSound('/ring.mp3');

		const playing = sound.play();
		sound.stop();
		await flush();
		await playing;

		expect(audio.sources).toHaveLength(0);
	});

	it('decodes once and reuses the buffer', async () => {
		const audio = installFakeWebAudio();
		const { createSound } = await load();
		const sound = createSound('/ring.mp3');

		for (let i = 0; i < 3; i += 1) {
			const playing = sound.play();
			await flush();
			await playing;
		}

		expect(audio.fetchMock).toHaveBeenCalledTimes(1);
	});

	it('tries again after a failed load instead of staying silent', async () => {
		const audio = installFakeWebAudio();
		audio.fetchMock.mockRejectedValueOnce(new Error('offline'));
		const { createSound } = await load();
		const sound = createSound('/ring.mp3');

		const first = sound.play();
		const failed = expect(first).rejects.toThrow('offline');
		await flush();
		await failed;

		const second = sound.play();
		await flush();
		await second;

		expect(audio.sources).toHaveLength(1);
	});

	describe('first gesture', () => {
		it('starts the context and decodes the sounds, once', async () => {
			const audio = installFakeWebAudio();
			const { createSound } = await load();
			createSound('/ring.mp3');

			window.dispatchEvent(new Event('pointerdown'));
			await flush();
			const resumed = audio.contexts[0].resume.mock.calls.length;

			window.dispatchEvent(new Event('keydown'));
			window.dispatchEvent(new Event('pointerdown'));
			await flush();

			expect(audio.contexts[0].state).toBe('running');
			expect(audio.fetchMock).toHaveBeenCalledTimes(1);
			expect(audio.contexts[0].resume.mock.calls.length).toBe(resumed);
		});

		it('does not interrupt a sound that is already playing', async () => {
			const audio = installFakeWebAudio();
			const { createSound } = await load();
			const sound = createSound('/ring.mp3', {
				loop: true,
			});
			const playing = sound.play();
			await flush();
			await playing;

			// the agent types while the offer rings
			window.dispatchEvent(new Event('keydown'));
			await flush();

			expect(audio.sources[0].stop).not.toHaveBeenCalled();
		});
	});
});
