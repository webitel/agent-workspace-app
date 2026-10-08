import ringingSound from '@webitel/ui-sdk/src/modules/Notifications/assets/audio/ringing.mp3';

import { createSound } from '../../../../sound/utils/createSound';
import { SoundLockKind, useSoundLock } from './useSoundLock';

/**
 * The looping ringtone for offers with a deadline (calls). One loop for the
 * whole app: several simultaneous offers share a single ring (a second loop
 * would just phase against the first), and the cross-tab lock keeps other tabs
 * quiet. Played through Web Audio so the OS media keys can't start it.
 */

/**
 * Generous next to a ring (~30s), short enough that a tab which died mid-ring
 * does not keep the others quiet. A ring outliving it would let a second tab
 * start its own loop, which is the same bound the old playing lock had.
 */
const RING_LOCK_MS = 2 * 60 * 1000;

const ring = createSound(ringingSound, {
	loop: true,
});

export function useRingtone() {
	const { acquire, release, isHeldByThisTab } = useSoundLock(
		SoundLockKind.Ringtone,
		RING_LOCK_MS,
	);

	function start() {
		if (isHeldByThisTab()) return; // already ringing here
		if (!acquire()) return; // another tab owns the sound

		ring.play().catch(() => {
			// autoplay blocked and no gesture yet — drop the lock so a tab that
			// *can* play (or this one, after the next gesture) isn't shut out
			release();
		});
	}

	function stop() {
		ring.stop();
		release();
	}

	return {
		start,
		stop,
	};
}
