import chatOfferSound from '@webitel/ui-sdk/src/modules/Notifications/assets/audio/chat-new.wav';

import { playSafely } from './playSafely';
import { useSoundLock } from './useSoundLock';

/**
 * One-shot cue for offers that are not time-critical enough to ring.
 *
 * Deliberately does not take the exclusive sound lock the ringtone holds. That
 * lock means "a loop owns the channel"; a one-shot that took it would silence a
 * second chat arriving a moment later, and releasing it afterwards would cut a
 * ringtone that happened to be running. The chirp only respects the main-tab
 * rule, so several tabs still don't chirp in chorus.
 *
 * Callers decide whether a chirp is appropriate — the store suppresses it while
 * a call is ringing, so a text chat never talks over a call with a deadline.
 */

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
	if (!audio) audio = new Audio(chatOfferSound);
	return audio;
}

export function useOfferChirp() {
	const { isMainTab } = useSoundLock();

	function play() {
		if (!isMainTab()) return;

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
