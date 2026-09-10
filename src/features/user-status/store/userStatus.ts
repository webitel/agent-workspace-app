import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import { getUserStatus, setUserStatus } from '../api/UsersStatusAPI';
import { UserStatus } from '../enums/UserStatus';
import { parseUserStatus } from '../scripts/parseUserStatus';

export const useUserStatusStore = defineStore('user-status', () => {
	const { getClient } = useWebSocketClient();

	const initialized = ref(false);
	const userStatus = ref<Record<UserStatus, boolean> | null>(null);
	const isDnd = computed(() => !!userStatus.value?.[UserStatus.Dnd]);

	async function subscribeUserStatus() {
		const client = getClient();

		await client.subscribeUsersStatus((value) => {
			userStatus.value = parseUserStatus(value.status);
		});
	}

	async function getCurrentUserStatus() {
		const status = await getUserStatus();
		console.log('resp:', status);
		userStatus.value = parseUserStatus(status);
	}

	async function toggleUserDnd() {
		const status = isDnd.value ? '' : UserStatus.Dnd;
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
