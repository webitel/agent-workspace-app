import { UserPresenceStatus } from '@webitel/ui-sdk/enums';
import { parseUserPresence } from '@webitel/ui-sdk/scripts';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import { getUserStatus, setUserStatus } from '../api/UsersStatusAPI';

export const useUserStatusStore = defineStore('user-status', () => {
	const { getClient } = useWebSocketClient();

	const initialized = ref(false);
	const userStatus = ref<Record<UserPresenceStatus, boolean> | null>(null);
	const isDnd = computed(() => !!userStatus.value?.[UserPresenceStatus.Dnd]);

	async function subscribeUserStatus() {
		const client = getClient();

		await client.subscribeUsersStatus((value) => {
			userStatus.value = parseUserPresence(value.status);
		});
	}

	async function getCurrentUserStatus() {
		const status = await getUserStatus();
		userStatus.value = parseUserPresence(status);
	}

	async function toggleUserDnd() {
		const status = isDnd.value ? '' : UserPresenceStatus.Dnd;
		await setUserStatus(status);
	}

	async function initialize() {
		if (initialized.value) return;

		await subscribeUserStatus();
		await getCurrentUserStatus();

		initialized.value = true;
	}

	return {
		userStatus,
		isDnd,

		initialize,
		getCurrentUserStatus,
		toggleUserDnd,
	};
});
