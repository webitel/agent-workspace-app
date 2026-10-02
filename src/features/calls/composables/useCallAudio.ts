import type { Call } from 'webitel-sdk';

import { playSafely } from '../../../ui/sound/utils/playSafely';

export function useCallAudio() {
	const remoteAudioByCallId = new Map<string, HTMLAudioElement>();

	function stopRemoteAudio(callId: string): void {
		const audio = remoteAudioByCallId.get(callId);
		if (!audio) return;

		audio.pause();
		audio.srcObject = null;
		remoteAudioByCallId.delete(callId);
	}

	function playRemoteAudio(call: Call): void {
		const remoteStream = call.peerStreams?.at(-1);
		if (!remoteStream) return;

		stopRemoteAudio(call.id);

		const audio = new Audio();
		audio.srcObject = remoteStream;
		remoteAudioByCallId.set(call.id, audio);

		playSafely(audio).catch((err) => {
			console.warn('[calls] remote audio playback failed', err);
		});
	}

	return {
		playRemoteAudio,
		stopRemoteAudio,
	};
}
