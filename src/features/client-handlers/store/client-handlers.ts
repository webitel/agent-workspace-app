import { defineStore } from 'pinia';
import { ref } from 'vue';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';

export const useClientHandlersStore = defineStore('clientHandlers', () => {
	const { getClient } = useWebSocketClient();

	const isPhoneReg = ref(false);

	const subscribeToPhoneRegistration = async () => {
		const client = getClient();

		client.on('phone_registered', (value) => {
			isPhoneReg.value = value;
		});

		if (client.phoneIsRegister()) isPhoneReg.value = true;
	};

	return {
		isPhoneReg,

		subscribeToPhoneRegistration,
	};
});
