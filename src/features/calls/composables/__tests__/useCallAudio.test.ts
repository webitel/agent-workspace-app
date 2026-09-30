import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Call } from 'webitel-sdk';

import { useCallAudio } from '../useCallAudio';

/**
 * @author Oleksandr Palonnyi
 * jsdom has no MediaStream; the composable only hands it to `srcObject`.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
const buildStream = (): MediaStream => ({}) as MediaStream;

const buildCall = (peerStreams: MediaStream[], id = 'call-1'): Call =>
	({
		id,
		peerStreams,
	}) as unknown as Call;

describe('useCallAudio', () => {
	let playedElements: HTMLMediaElement[];
	let pausedElements: HTMLMediaElement[];

	beforeEach(() => {
		playedElements = [];
		pausedElements = [];
		/**
		 * @author Oleksandr Palonnyi
		 * jsdom doesn't implement media playback, so record the elements instead.
		 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
		 */
		vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
			this: HTMLMediaElement,
		) {
			playedElements.push(this);
			return Promise.resolve();
		});
		vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
			this: HTMLMediaElement,
		) {
			pausedElements.push(this);
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('plays the latest remote stream of the call', () => {
		const { playRemoteAudio } = useCallAudio();
		const liveStream = buildStream();

		playRemoteAudio(
			buildCall([
				buildStream(),
				liveStream,
			]),
		);

		expect(playedElements).toHaveLength(1);
		expect(playedElements[0].srcObject).toBe(liveStream);
	});

	it('does nothing while the call has no remote stream yet', () => {
		const { playRemoteAudio } = useCallAudio();

		playRemoteAudio(buildCall([]));

		expect(playedElements).toHaveLength(0);
	});

	it('replaces the playing element when the stream is renegotiated', () => {
		const { playRemoteAudio } = useCallAudio();
		const call = buildCall([
			buildStream(),
		]);

		playRemoteAudio(call);
		const [firstElement] = playedElements;
		call.peerStreams.push(buildStream());
		playRemoteAudio(call);

		expect(pausedElements).toEqual([
			firstElement,
		]);
		expect(playedElements).toHaveLength(2);
	});

	it('stops the remote audio of the ended call only', () => {
		const { playRemoteAudio, stopRemoteAudio } = useCallAudio();
		playRemoteAudio(
			buildCall(
				[
					buildStream(),
				],
				'call-1',
			),
		);
		playRemoteAudio(
			buildCall(
				[
					buildStream(),
				],
				'call-2',
			),
		);
		const [firstCallElement] = playedElements;

		stopRemoteAudio('call-1');

		expect(pausedElements).toEqual([
			firstCallElement,
		]);
		expect(firstCallElement.srcObject).toBeNull();
	});

	it('ignores stopping a call that never played', () => {
		const { stopRemoteAudio } = useCallAudio();

		expect(() => stopRemoteAudio('unknown')).not.toThrow();
		expect(pausedElements).toHaveLength(0);
	});
});
