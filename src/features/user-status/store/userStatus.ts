import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import { getUserStatus, setUserStatus } from '../api/UsersStatusAPI';
import { UserStatus } from '../enums/UserStatus';
import { parseUserStatus } from '../scripts/parseUserStatus';

export const useUserStatusStore = defineStore('user', () => {
	const { getClient } = useWebSocketClient();

	const userStatus = ref(null);
	const isDnd = computed(() => !!userStatus.value?.[UserStatus.Dnd]);

	async function subscribeUserStatus() {
		const client = getClient();
		await client.subscribeUsersStatus((value) => {
			userStatus.value = parseUserStatus(value.status);
		});

		await getCurrentUserStatus();
	}

	// helper action to get initial user-status status from HTTP request
	async function getCurrentUserStatus() {
		const response = await getUserStatus();
		userStatus.value = parseUserStatus(response);
	}

	async function toggleUserDnd() {
		const status = isDnd.value ? '' : UserStatus.Dnd;
		await setUserStatus(status);
	}

	return {
		userStatus,
		isDnd,

		subscribeUserStatus,
		getCurrentUserStatus,
		toggleUserDnd,
	};
});
