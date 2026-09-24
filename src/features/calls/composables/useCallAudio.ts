import type { Call } from 'webitel-sdk';

import { playSafely } from '../../../ui/notifications/sound/playSafely';

/**
 * @author Oleksandr Palonnyi
 * The SDK negotiates the WebRTC media but never attaches it to an output
 * element, so without this every call connects silently on the agent's side.
 * Elements are keyed by call id rather than stored on the `Call` (as
 * cc-workspaces did with `call.workspaceAudio`) so we don't write foreign
 * fields onto an SDK object.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
export function useCallAudio() {
	const remoteAudioByCallId = new Map<string, HTMLAudioElement>();

	function stopRemoteAudio(callId: string): void {
		const audio = remoteAudioByCallId.get(callId);
		if (!audio) return;

		audio.pause();
		audio.srcObject = null;
		remoteAudioByCallId.delete(callId);
	}

	/**
	 * @author Oleksandr Palonnyi
	 * `PeerStream` can fire more than once per call and `peerStreams` only grows,
	 * so the last stream is the live one (as cc-workspaces reads it) and it
	 * replaces any element already playing for this call.
	 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
	 */
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
