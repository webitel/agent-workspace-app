import { defineStore } from 'pinia';
import { ref } from 'vue';
import UsersAPIRepository from '../../../app/api/endpoints/users/UsersAPIRepository';
import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import UserStatus from '../enums/UserStatus';
import parseUserStatus from '../scripts/parseUserStatus';

export const useUserStore = defineStore('user', () => {
	const { getClient } = useWebSocketClient();

	const user = ref({
		status: {},
	});

	const userStatusHandler = (user) => ({
		status: parseUserStatus(user),
	});

	async function subscribeUserStatus() {
		try {
			const client = getClient();
			await client.subscribeUsersStatus((presence) => {
				user.value = userStatusHandler(presence);
			});

			await getCurrentUserStatus();
		} catch (error) {
			console.error('[User Store] subscribeUserStatus failed', error);
		}
	}

	// helper action to get initial user status from HTTP request
	async function getCurrentUserStatus() {
		try {
			const presence = await UsersAPIRepository.getUserStatus();
			user.value = userStatusHandler(presence);
		} catch (error) {
			console.error('[User Store] getCurrentUserStatus failed', error);
		}
	}

	async function toggleUserDND() {
		try {
			const status = user.value.status?.[UserStatus.DND] ? '' : UserStatus.DND;
			await UsersAPIRepository.setUserStatus(status);
		} catch (error) {
			console.error('[User Store] toggleUserDND failed', error);
		}
	}

	return {
		user,

		subscribeUserStatus,
		getCurrentUserStatus,
		toggleUserDND,
	};
});
