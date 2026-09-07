import { defineStore } from 'pinia';
import { ref } from 'vue';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import { WebSocketClientEvent } from '../../../app/api/socket/enums/WebSocketClientEvent.enum';

export const useGlobalHandlersStore = defineStore('globalHandlers', () => {
	const { getClient, on: onWebSocketEvent } = useWebSocketClient();

	const isPhoneReg = ref(false);

	const subscribeToPhoneRegistration = async () => {
		const client = getClient();

		onWebSocketEvent(WebSocketClientEvent.PhoneRegistered, (value: boolean) => {
			isPhoneReg.value = value;
		});

		if (client.phoneIsRegister()) isPhoneReg.value = true;
	};

	return {
		isPhoneReg,

		subscribeToPhoneRegistration,
	};
});
