import ringingSound from '@webitel/ui-sdk/src/modules/Notifications/assets/audio/ringing.mp3';

import { playSafely } from '../utils/playSafely';
import { SoundLockKind, useSoundLock } from './useSoundLock';

/**
 * The looping ringtone for offers with a deadline (calls). One looping element for the whole app: several
 * simultaneous offers share a single ring (a second loop would just phase
 * against the first), and the cross-tab lock keeps other tabs quiet.
 */

/**
 * Generous next to a ring (~30s), short enough that a tab which died mid-ring
 * does not keep the others quiet. A ring outliving it would let a second tab
 * start its own loop, which is the same bound the old playing lock had.
 */
const RING_LOCK_MS = 2 * 60 * 1000;

let audio: HTMLAudioElement | null = null;
let primed = false;

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
 *
 * Both listeners are torn down through one `AbortController`. `{ once: true }`
 * is not enough: it drops only the listener that fired, leaving the other armed,
 * and priming a second time mid-ring pauses the ringtone — an agent who types
 * during an offer would silence it.
 */
function primeOnFirstGesture() {
	if (primed || typeof window === 'undefined') return;
	primed = true;

	const gestures = new AbortController();

	const prime = () => {
		gestures.abort();

		const element = getAudio();
		const wasMuted = element.muted;
		element.muted = true;
		playSafely(element)
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
		signal: gestures.signal,
	});
	window.addEventListener('keydown', prime, {
		signal: gestures.signal,
	});
}

export function useRingtone() {
	const { acquire, release, isHeldByThisTab } = useSoundLock(
		SoundLockKind.Ringtone,
		RING_LOCK_MS,
	);

	primeOnFirstGesture();

	function start() {
		if (isHeldByThisTab()) return; // already ringing here
		if (!acquire()) return; // another tab owns the sound

		const element = getAudio();
		element.currentTime = 0;
		playSafely(element).catch(() => {
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
