import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * jsdom ships neither `navigator.serviceWorker` nor `Notification`, so both are
 * installed per test. The module caches its registration and an `initialized`
 * flag, so every test loads it fresh.
 */

type MessageListener = (event: MessageEvent) => void;

interface ServiceWorkerStub {
	register: ReturnType<typeof vi.fn>;
	ready: Promise<unknown>;
	controller: {
		postMessage: ReturnType<typeof vi.fn>;
	} | null;
	addEventListener: ReturnType<typeof vi.fn>;
	messageListener: MessageListener | null;
}

function installServiceWorker({
	registerFails = false,
}: {
	registerFails?: boolean;
} = {}) {
	const activeWorker = {
		postMessage: vi.fn(),
	};
	const stub: ServiceWorkerStub = {
		register: vi.fn(async () => {
			if (registerFails) throw new Error('SecurityError');
			return {
				active: activeWorker,
			};
		}),
		ready: Promise.resolve({
			active: activeWorker,
		}),
		controller: activeWorker,
		addEventListener: vi.fn((type: string, listener: MessageListener) => {
			if (type === 'message') stub.messageListener = listener;
		}),
		messageListener: null,
	};

	Object.defineProperty(navigator, 'serviceWorker', {
		value: stub,
		configurable: true,
	});

	return {
		stub,
		activeWorker,
	};
}

function installNotification(permission: NotificationPermission = 'granted') {
	const requestPermission = vi.fn(async () => permission);
	Object.defineProperty(window, 'Notification', {
		value: {
			permission,
			requestPermission,
		},
		configurable: true,
	});
	return requestPermission;
}

function setVisibility(state: DocumentVisibilityState) {
	Object.defineProperty(document, 'visibilityState', {
		value: state,
		configurable: true,
	});
}

async function loadModule() {
	vi.resetModules();
	const { useOsNotifications } = await import('../useOsNotifications');
	return useOsNotifications();
}

describe('useOsNotifications', () => {
	beforeEach(() => {
		setVisibility('hidden');
		installNotification('granted');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('initialize', () => {
		/**
		 * Regression: vite's `base` carries no trailing slash, but a worker at
		 * `<base>/sw.js` can only claim `<base>/`. Registering with the bare base
		 * fails with a SecurityError, which went unnoticed for a while.
		 */
		it('registers the worker with a trailing-slash scope', async () => {
			const { stub } = installServiceWorker();
			const osNotifications = await loadModule();

			await osNotifications.initialize();

			expect(stub.register).toHaveBeenCalledTimes(1);
			const [scriptUrl, options] = stub.register.mock.calls[0];
			expect(String(scriptUrl)).toMatch(/\/sw\.js$/);
			expect(String(options.scope)).toMatch(/\/$/);
		});

		it('does not throw when registration is refused', async () => {
			installServiceWorker({
				registerFails: true,
			});
			const osNotifications = await loadModule();

			await expect(osNotifications.initialize()).resolves.toBeUndefined();
		});

		it('registers only once across repeated calls', async () => {
			const { stub } = installServiceWorker();
			const osNotifications = await loadModule();

			await osNotifications.initialize();
			await osNotifications.initialize();

			expect(stub.register).toHaveBeenCalledTimes(1);
		});
	});

	describe('show', () => {
		it('posts a notification when the tab is hidden', async () => {
			const { activeWorker } = installServiceWorker();
			const osNotifications = await loadModule();
			await osNotifications.initialize();

			await osNotifications.show({
				id: 'call-1',
				title: 'Incoming call request',
				body: 'John Smith: 380671234678',
				actions: [
					{
						action: 'accept',
						title: 'Accept',
					},
				],
				onAction: vi.fn(),
			});

			expect(activeWorker.postMessage).toHaveBeenCalledWith({
				type: 'notification',
				payload: {
					id: 'call-1',
					title: 'Incoming call request',
					body: 'John Smith: 380671234678',
					actions: [
						{
							action: 'accept',
							title: 'Accept',
						},
					],
				},
			});
		});

		/** The in-app card already covers a visible tab. */
		it('posts nothing while the tab is visible', async () => {
			setVisibility('visible');
			const { activeWorker } = installServiceWorker();
			const osNotifications = await loadModule();
			await osNotifications.initialize();

			await osNotifications.show({
				id: 'call-1',
				title: 'Incoming call request',
				onAction: vi.fn(),
			});

			expect(activeWorker.postMessage).not.toHaveBeenCalled();
		});

		it('posts nothing without notification permission', async () => {
			installNotification('default');
			const { activeWorker } = installServiceWorker();
			const osNotifications = await loadModule();
			await osNotifications.initialize();

			await osNotifications.show({
				id: 'call-1',
				title: 'Incoming call request',
				onAction: vi.fn(),
			});

			expect(activeWorker.postMessage).not.toHaveBeenCalled();
		});
	});

	describe('close', () => {
		it('asks the worker to close that notification', async () => {
			const { activeWorker } = installServiceWorker();
			const osNotifications = await loadModule();
			await osNotifications.initialize();

			osNotifications.close('call-1');

			expect(activeWorker.postMessage).toHaveBeenCalledWith({
				type: 'close-notification',
				payload: {
					id: 'call-1',
				},
			});
		});

		/**
		 * Regression: `close()` dereferenced `navigator.serviceWorker` without the
		 * support guard `show()` had, so it threw wherever service workers are
		 * unavailable.
		 */
		it('is a no-op where service workers are unavailable', async () => {
			const osNotifications = await loadModule();
			// @ts-expect-error deleting a stubbed property
			delete navigator.serviceWorker;

			expect(() => osNotifications.close('call-1')).not.toThrow();
		});
	});

	describe('action routing', () => {
		/**
		 * Keyed by interaction id rather than a one-shot subscription: with two
		 * offers on screen, a positional subscription answers the wrong one.
		 */
		it('routes a click to the handler for that interaction', async () => {
			const { stub } = installServiceWorker();
			const osNotifications = await loadModule();
			await osNotifications.initialize();

			const first = vi.fn();
			const second = vi.fn();
			await osNotifications.show({
				id: 'call-1',
				title: 'first',
				onAction: first,
			});
			await osNotifications.show({
				id: 'call-2',
				title: 'second',
				onAction: second,
			});

			stub.messageListener?.({
				data: {
					type: 'notificationclick',
					id: 'call-2',
					action: 'accept',
				},
			} as MessageEvent);

			expect(second).toHaveBeenCalledWith('accept');
			expect(first).not.toHaveBeenCalled();
		});

		/** A body click only focuses the window; the worker handles that. */
		it('ignores a click that carries no action', async () => {
			const { stub } = installServiceWorker();
			const osNotifications = await loadModule();
			await osNotifications.initialize();

			const onAction = vi.fn();
			await osNotifications.show({
				id: 'call-1',
				title: 'first',
				onAction,
			});

			stub.messageListener?.({
				data: {
					type: 'notificationclick',
					id: 'call-1',
				},
			} as MessageEvent);

			expect(onAction).not.toHaveBeenCalled();
		});

		it('ignores unrelated worker messages', async () => {
			const { stub } = installServiceWorker();
			const osNotifications = await loadModule();
			await osNotifications.initialize();

			const onAction = vi.fn();
			await osNotifications.show({
				id: 'call-1',
				title: 'first',
				onAction,
			});

			stub.messageListener?.({
				data: {
					type: 'something-else',
					id: 'call-1',
					action: 'accept',
				},
			} as MessageEvent);
			stub.messageListener?.({} as MessageEvent);

			expect(onAction).not.toHaveBeenCalled();
		});

		it('stops routing to a handler once its notification is closed', async () => {
			const { stub } = installServiceWorker();
			const osNotifications = await loadModule();
			await osNotifications.initialize();

			const onAction = vi.fn();
			await osNotifications.show({
				id: 'call-1',
				title: 'first',
				onAction,
			});
			osNotifications.close('call-1');

			stub.messageListener?.({
				data: {
					type: 'notificationclick',
					id: 'call-1',
					action: 'accept',
				},
			} as MessageEvent);

			expect(onAction).not.toHaveBeenCalled();
		});
	});
});
