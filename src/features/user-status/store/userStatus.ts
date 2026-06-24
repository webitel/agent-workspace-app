import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { userStatusAPIRepository } from '../../../app/api/endpoints/users/UsersStatusAPIRepository';
import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import { UserStatus } from '../enums/UserStatus';
import parseUserStatus from '../scripts/parseUserStatus';

export const useUserStatusStore = defineStore('user', () => {
	const { getClient } = useWebSocketClient();

	const userStatus = ref(null);
	const isDnd = computed(() => !!userStatus.value?.[UserStatus.Dnd]);

	async function subscribeUserStatus() {
		try {
			const client = getClient();
			await client.subscribeUsersStatus((value) => {
				userStatus.value = parseUserStatus(value);
			});

			await getCurrentUserStatus();
		} catch (error) {
			console.error('[User Store] subscribeUserStatus failed', error);
		}
	}

	// helper action to get initial user-status status from HTTP request
	async function getCurrentUserStatus() {
		try {
			const response = await userStatusAPIRepository.get();
			userStatus.value = parseUserStatus(response);
		} catch (error) {
			console.error('[User Store] getCurrentUserStatus failed', error);
		}
	}

	async function toggleUserDnd() {
		try {
			const status = isDnd.value ? '' : UserStatus.Dnd;
			await userStatusAPIRepository.set(status);
		} catch (error) {
			console.error('[User Store] toggleUserDND failed', error);
		}
	}

	return {
		userStatus,
		isDnd,

		subscribeUserStatus,
		getCurrentUserStatus,
		toggleUserDnd,
	};
});
