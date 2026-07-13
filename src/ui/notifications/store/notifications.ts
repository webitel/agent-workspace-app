import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';

export interface NotificationAction {
	label: string;
	color?: string;
	handler: () => void;
}

export interface AppNotification {
	id: string;
	title?: string;
	text: string;
	actions: NotificationAction[];
}

let sequence = 0;

export const useNotificationsStore = defineStore('notifications', () => {
	const notifications = ref<AppNotification[]>([]);

	function notify(input: Omit<AppNotification, 'id'>): string {
		const id = String(++sequence);
		notifications.value.push({
			id,
			...input,
		});
		return id;
	}

	function dismiss(notificationId: string) {
		notifications.value = notifications.value.filter(
			(notification) => notification.id !== notificationId,
		);
	}

	function runAction(notificationId: string, action: NotificationAction) {
		action.handler();
		dismiss(notificationId);
	}

	return {
		notifications,
		notify,
		dismiss,
		runAction,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useNotificationsStore, import.meta.hot),
	);
}
