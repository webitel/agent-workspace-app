import { vi } from 'vitest';

/** jsdom has no Web Audio: stands in for the parts `createSound` touches. */
export function installFakeWebAudio({ canStart = true } = {}) {
	const sources: FakeSource[] = [];
	const contexts: FakeContext[] = [];

	class FakeSource {
		buffer: unknown = null;
		loop = false;
		onended: (() => void) | null = null;
		connect = vi.fn();
		disconnect = vi.fn();
		start = vi.fn();
		stop = vi.fn();

		constructor() {
			sources.push(this);
		}
	}

	class FakeContext extends EventTarget {
		state: 'suspended' | 'running' = 'suspended';
		destination = {};
		decodeAudioData = vi.fn(() =>
			Promise.resolve({
				duration: 1,
			}),
		);
		createBufferSource = vi.fn(() => new FakeSource());
		resume = vi.fn(() => {
			if (canStart && this.state !== 'running') {
				this.state = 'running';
				this.dispatchEvent(new Event('statechange'));
			}
			return Promise.resolve();
		});

		constructor() {
			super();
			contexts.push(this);
		}
	}

	const fetchMock = vi.fn(() =>
		Promise.resolve({
			arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
		}),
	);

	vi.stubGlobal('AudioContext', FakeContext);
	vi.stubGlobal('fetch', fetchMock);

	// the whole point: nothing here may reach the OS media controls
	const mediaPlay = vi
		.spyOn(HTMLMediaElement.prototype, 'play')
		.mockImplementation(() => Promise.resolve());
	const AudioElement = vi.fn();
	vi.stubGlobal('Audio', AudioElement);

	return {
		sources,
		contexts,
		fetchMock,
		mediaPlay,
		AudioElement,
	};
}

/** Lets pending promise chains (fetch, decode, resume) settle. */
export async function flush() {
	for (let i = 0; i < 8; i += 1) await Promise.resolve();
}

/**
 * Each test loads a fresh `createSound` module, and every one arms window
 * listeners for the first gesture. Fire them while this test's globals are
 * still stubbed, so they cannot leak into the next test's gesture.
 */
export async function drainGestureListeners() {
	window.dispatchEvent(new Event('pointerdown'));
	await flush();
}
