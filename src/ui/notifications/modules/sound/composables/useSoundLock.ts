/**
 * Cross-tab "only one tab makes noise" lock.
 *
 * Every open workspace tab runs its own `Client` and receives the same ringing
 * event, so without a lock N tabs start N looping ringtones and answering in one
 * tab silences only that one. Ported from ui-sdk's Vuex `NotificationsStoreModule`
 * (`currentTabId` + `wtIsPlaying`), with two fixes: the holder is released on
 * unload, and a stale holder expires instead of muting the app forever.
 */

const TAB_ID_KEY = 'currentTabId';
const PLAYING_KEY = 'wtIsPlaying';

/**
 * A crashed tab can't run its unload handler, so a lock older than this is
 * treated as abandoned. Generous compared to a ring (~30s) but short enough
 * that the next call is audible.
 */
const STALE_LOCK_MS = 2 * 60 * 1000;

const tabId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface PlayingLock {
	tabId: string;
	at: number;
}

function readLock(): PlayingLock | null {
	try {
		const raw = localStorage.getItem(PLAYING_KEY);
		if (!raw) return null;
		const lock = JSON.parse(raw) as PlayingLock;
		if (!lock?.tabId || typeof lock.at !== 'number') return null;
		return lock;
	} catch {
		return null;
	}
}

function isStale(lock: PlayingLock): boolean {
	return Date.now() - lock.at > STALE_LOCK_MS;
}

/** Claim the "main" tab slot if nobody holds it (first tab wins, survives reload). */
function claimTabSlotIfFree() {
	try {
		if (!localStorage.getItem(TAB_ID_KEY)) {
			localStorage.setItem(TAB_ID_KEY, tabId);
		}
	} catch {
		// private mode / blocked storage — fall through, acquire() degrades to "always allowed"
	}
}

export function useSoundLock() {
	claimTabSlotIfFree();

	function isMainTab(): boolean {
		try {
			const owner = localStorage.getItem(TAB_ID_KEY);
			// no owner recorded (storage blocked) -> don't mute this tab
			return !owner || owner === tabId;
		} catch {
			return true;
		}
	}

	/** True when this tab may start a sound. Claims the lock as a side effect. */
	function acquire(): boolean {
		if (!isMainTab()) return false;

		const lock = readLock();
		// someone (possibly this tab) is already ringing — don't stack a second loop
		if (lock && !isStale(lock)) return false;

		try {
			localStorage.setItem(
				PLAYING_KEY,
				JSON.stringify({
					tabId,
					at: Date.now(),
				}),
			);
		} catch {
			// storage unavailable: still allow the sound, just without cross-tab dedup
		}
		return true;
	}

	function release() {
		const lock = readLock();
		// never clear another tab's lock
		if (lock && lock.tabId !== tabId && !isStale(lock)) return;
		try {
			localStorage.removeItem(PLAYING_KEY);
		} catch {
			// nothing to do
		}
	}

	/** Whether this tab currently owns the lock. */
	function isHeldByThisTab(): boolean {
		const lock = readLock();
		return !!lock && lock.tabId === tabId && !isStale(lock);
	}

	return {
		tabId,
		isMainTab,
		acquire,
		release,
		isHeldByThisTab,
	};
}

/**
 * Module-level unload cleanup: releases this tab's lock and frees the main-tab
 * slot so a surviving tab can take over. Registered once per document.
 */
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		const { release } = useSoundLock();
		release();
		try {
			if (localStorage.getItem(TAB_ID_KEY) === tabId) {
				localStorage.removeItem(TAB_ID_KEY);
			}
		} catch {
			// nothing to do
		}
	});
}
