import ringingSound from '@webitel/ui-sdk/src/modules/Notifications/assets/audio/ringing.mp3';

import { useSoundLock } from './useSoundLock';

/**
 * The incoming-offer ringtone. One looping element for the whole app: several
 * simultaneous offers share a single ring (a second loop would just phase
 * against the first), and the cross-tab lock keeps other tabs quiet.
 */

let audio: HTMLAudioElement | null = null;
let primed = false;

/**
 * `HTMLMediaElement.play()` only returns a promise in modern browsers — older
 * Safari (and jsdom) return undefined, so never chain off it directly.
 */
function play(element: HTMLAudioElement): Promise<void> {
	try {
		return Promise.resolve(element.play());
	} catch (err) {
		return Promise.reject(err);
	}
}

function getAudio(): HTMLAudioElement {
	if (!audio) {
		audio = new Audio(ringingSound);
		audio.loop = true;
	}
	return audio;
}

/**
 * Browsers reject `play()` until the document has been interacted with, so the
 * very first ring after a fresh load can be swallowed. Prime the element on the
 * first gesture: a muted play/pause counts as the activation, after which later
 * `play()` calls are allowed.
 */
function primeOnFirstGesture() {
	if (primed || typeof window === 'undefined') return;
	primed = true;

	const prime = () => {
		const element = getAudio();
		const wasMuted = element.muted;
		element.muted = true;
		play(element)
			.then(() => {
				element.pause();
				element.currentTime = 0;
			})
			.catch(() => {
				// still blocked; the next gesture will try again via the ring itself
			})
			.finally(() => {
				element.muted = wasMuted;
			});
	};

	window.addEventListener('pointerdown', prime, {
		once: true,
	});
	window.addEventListener('keydown', prime, {
		once: true,
	});
}

export function useRingtone() {
	const { acquire, release, isHeldByThisTab } = useSoundLock();

	primeOnFirstGesture();

	function start() {
		if (isHeldByThisTab()) return; // already ringing here
		if (!acquire()) return; // another tab owns the sound

		const element = getAudio();
		element.currentTime = 0;
		play(element).catch(() => {
			// autoplay blocked and no gesture yet — drop the lock so a tab that
			// *can* play (or this one, after the next gesture) isn't shut out
			release();
		});
	}

	function stop() {
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
		}
		release();
	}

	return {
		start,
		stop,
	};
}
