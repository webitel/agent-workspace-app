/**
 * Notification-only service worker for the agent workspace.
 *
 * Deliberately minimal: no workbox, no precaching, no PWA manifest. The only
 * capability we need from a SW is `showNotification` with action buttons, which
 * the page-level Notification API cannot provide.
 *
 * Contract with the page (see `useOsNotifications`):
 *   page -> sw : { type: 'notification', payload: { id, title, body, actions } }
 *   page -> sw : { type: 'close-notification', payload: { id } }
 *   sw  -> page: { type: 'notificationclick', id, action }
 *
 * `id` travels in both directions and is used as the notification `tag`, so
 * several simultaneous offers can never resolve to the wrong interaction.
 */

self.skipWaiting();

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

function showNotification({ id, title, body, actions }) {
	return self.registration.showNotification(title, {
		body,
		actions,
		// same tag across tabs collapses duplicates into one notification
		tag: id,
		// the in-app ringtone is the audio channel; don't double up
		silent: true,
		// offers are time-critical: don't let the OS auto-dismiss them
		requireInteraction: true,
	});
}

async function closeNotification({ id }) {
	const open = await self.registration.getNotifications({
		tag: id,
	});
	for (const notification of open) {
		notification.close();
	}
}

self.addEventListener('message', (event) => {
	const { type, payload } = event.data ?? {};

	switch (type) {
		case 'notification':
			event.waitUntil(showNotification(payload));
			break;
		case 'close-notification':
			event.waitUntil(closeNotification(payload));
			break;
		default:
			break;
	}
});

self.addEventListener('notificationclick', (event) => {
	const { tag } = event.notification;
	const { action } = event;

	event.notification.close();

	event.waitUntil(
		(async () => {
			const clients = await self.clients.matchAll({
				type: 'window',
				includeUncontrolled: true,
			});

			for (const client of clients) {
				client.postMessage({
					type: 'notificationclick',
					id: tag,
					action,
				});
			}

			// clicking the notification body (no action) should surface the app
			if (!action && clients.length) {
				await clients[0].focus();
			}
		})(),
	);
});
