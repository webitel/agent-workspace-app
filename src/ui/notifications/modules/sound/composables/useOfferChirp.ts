import chatOfferSound from '@webitel/ui-sdk/src/modules/Notifications/assets/audio/chat-new.wav';

import { playSafely } from '../utils/playSafely';
import { SoundLockKind, useSoundLock } from './useSoundLock';

/**
 * One-shot cue for offers that are not time-critical enough to ring.
 *
 * Takes its own lock, not the ringtone's: a one-shot that held the ringtone's
 * lock would cut a ring that happened to be running, and a ring would swallow
 * every chirp behind it. The chirp's lock only has to outlive the sound itself,
 * so it is never released — it expires, and that window is what keeps several
 * tabs from chirping in chorus.
 *
 * Callers decide whether a chirp is appropriate — the store suppresses it while
 * a call is ringing, so a text chat never talks over a call with a deadline.
 */

/** Long enough to cover one cue, short enough not to swallow the next offer. */
const CHIRP_LOCK_MS = 1000;

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
	if (!audio) audio = new Audio(chatOfferSound);
	return audio;
}

export function useOfferChirp() {
	const { acquire } = useSoundLock(SoundLockKind.Chirp, CHIRP_LOCK_MS);

	function play() {
		if (!acquire()) return; // another tab just chirped for this offer

		const element = getAudio();
		element.currentTime = 0;
		playSafely(element).catch(() => {
			// autoplay still blocked, or no output device — the card carries the offer
		});
	}

	return {
		play,
	};
}
