/**
 * Page-side bridge to the notification service worker (`public/sw.js`).
 *
 * OS notifications exist so a backgrounded agent still sees an offer. When the
 * tab is visible the in-app card already covers it, so nothing is posted.
 *
 * Action routing is keyed by interaction id (the notification `tag`) rather than
 * a one-shot subscription: with two offers on screen, a positional subscription
 * resolves the wrong one.
 */

type NotificationActionHandler = (action: string) => void;

interface OsNotificationInput {
	id: string;
	title: string;
	body?: string;
	actions?: {
		action: string;
		title: string;
	}[];
	onAction: NotificationActionHandler;
}

const handlers = new Map<string, NotificationActionHandler>();

let registration: ServiceWorkerRegistration | null = null;
let initialized = false;

function isSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'Notification' in window
	);
}

function onWorkerMessage(event: MessageEvent) {
	const { type, id, action } = event.data ?? {};
	if (type !== 'notificationclick' || !id) return;

	// clicking the body (no action) only focuses the window — the SW handles that
	if (!action) return;

	handlers.get(id)?.(action);
}

/**
 * Chrome requires user activation for `requestPermission()`, so this can't run
 * at boot. Arm it on the first interaction after the workspace is up.
 */
function requestPermissionOnFirstGesture() {
	if (Notification.permission !== 'default') return;

	const ask = () => {
		Notification.requestPermission().catch(() => {
			// user dismissed or the browser refused; in-app card still works
		});
	};

	window.addEventListener('pointerdown', ask, {
		once: true,
	});
	window.addEventListener('keydown', ask, {
		once: true,
	});
}

export function useOsNotifications() {
	async function initialize(): Promise<void> {
		if (initialized || !isSupported()) return;
		initialized = true;

		// vite's `base` has no trailing slash, but a worker at `<base>/sw.js` can
		// only claim the `<base>/` scope — registering with the bare base is a
		// SecurityError.
		const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/`;

		try {
			registration = await navigator.serviceWorker.register(`${base}sw.js`, {
				scope: base,
			});
		} catch (err) {
			console.warn('[notifications] service worker registration failed', err);
			return;
		}

		navigator.serviceWorker.addEventListener('message', onWorkerMessage);
		requestPermissionOnFirstGesture();
	}

	function canShow(): boolean {
		return (
			isSupported() &&
			Notification.permission === 'granted' &&
			// the in-app card is already visible — no need to duplicate it
			document.visibilityState === 'hidden'
		);
	}

	async function show({
		id,
		title,
		body,
		actions,
		onAction,
	}: OsNotificationInput): Promise<void> {
		if (!canShow()) return;

		const worker = registration?.active ?? navigator.serviceWorker.controller;
		if (!worker) return;

		handlers.set(id, onAction);
		worker.postMessage({
			type: 'notification',
			payload: {
				id,
				title,
				body,
				actions,
			},
		});
	}

	function close(id: string): void {
		handlers.delete(id);

		if (!isSupported()) return;

		const worker = registration?.active ?? navigator.serviceWorker.controller;
		worker?.postMessage({
			type: 'close-notification',
			payload: {
				id,
			},
		});
	}

	return {
		initialize,
		show,
		close,
	};
}
