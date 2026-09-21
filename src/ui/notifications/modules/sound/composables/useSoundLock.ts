/**
 * Cross-tab "only one tab makes this noise" lock.
 *
 * Every open workspace tab runs its own `Client` and receives the same ringing
 * event, so without a lock N tabs start N sounds and answering in one silences
 * only that one. Each sound class takes its own lock: a short-lived stamp under
 * a key of ours, carrying the holder's tab id and an expiry.
 *
 * There is deliberately no "main tab" slot any more. The previous design kept
 * one under the bare `currentTabId` key, claimed by whichever tab arrived first
 * and never expired, and two things broke it:
 *
 * - ui-sdk's Vuex `NotificationsStoreModule` writes that same key, and writes it
 *   *unconditionally* on load. Every Webitel app shares this origin, so opening
 *   the admin panel or the CRM handed the slot to a tab of another app and muted
 *   this one for good.
 * - A tab that died without running its unload handler left the slot pointing at
 *   a dead id, with the same result.
 *
 * A lock that expires cannot do either, and a key of ours cannot be taken by
 * another app. The legacy `currentTabId` / `wtIsPlaying` keys are left alone:
 * they still belong to the apps that read them.
 */

export const SoundLockKind = {
	Ringtone: 'ringtone',
	Chirp: 'chirp',
} as const;

export type SoundLockKind = (typeof SoundLockKind)[keyof typeof SoundLockKind];

const KEY_PREFIX = 'wt/agent-workspace/sound-lock/';

const tabId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface SoundLock {
	tabId: string;
	/** Epoch ms after which any tab may take over. */
	until: number;
}

function keyFor(kind: SoundLockKind): string {
	return `${KEY_PREFIX}${kind}`;
}

/** An expired lock reads as no lock at all, so takeover needs no sweeping. */
function read(kind: SoundLockKind): SoundLock | null {
	try {
		const raw = localStorage.getItem(keyFor(kind));
		if (!raw) return null;
		const lock = JSON.parse(raw) as SoundLock;
		if (!lock?.tabId || typeof lock.until !== 'number') return null;
		if (Date.now() >= lock.until) return null;
		return lock;
	} catch {
		return null;
	}
}

function clear(kind: SoundLockKind) {
	const lock = read(kind);
	// never clear a lock a live tab still owns
	if (lock && lock.tabId !== tabId) return;
	try {
		localStorage.removeItem(keyFor(kind));
	} catch {
		// nothing to do
	}
}

export function useSoundLock(kind: SoundLockKind, ttlMs: number) {
	/**
	 * True when this tab may start the sound, claiming or renewing the lock as a
	 * side effect. A tab that already holds it renews rather than being refused —
	 * callers that must not restart their own sound check `isHeldByThisTab`.
	 */
	function acquire(): boolean {
		const lock = read(kind);
		if (lock && lock.tabId !== tabId) return false;

		try {
			localStorage.setItem(
				keyFor(kind),
				JSON.stringify({
					tabId,
					until: Date.now() + ttlMs,
				}),
			);
		} catch {
			// storage unavailable: still allow the sound, just without cross-tab dedup
		}
		return true;
	}

	function release() {
		clear(kind);
	}

	function isHeldByThisTab(): boolean {
		return read(kind)?.tabId === tabId;
	}

	return {
		tabId,
		acquire,
		release,
		isHeldByThisTab,
	};
}

/** Frees this tab's locks so a surviving tab can take over without waiting. */
export function releaseSoundLocks() {
	for (const kind of Object.values(SoundLockKind)) {
		clear(kind);
	}
}

if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', releaseSoundLocks);
}
