import { defineStore } from 'pinia';
import { ref } from 'vue';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import { WebSocketClientEvent } from '../../../app/api/socket/enums/WebSocketClientEvent.enum';

export const useGlobalHandlersStore = defineStore('global-handlers', () => {
	const { getClient, on: onWebSocketEvent } = useWebSocketClient();

	const isPhoneReg = ref(false);
	const initialized = ref(false);

	const subscribeToPhoneRegistration = () => {
		const client = getClient();

		onWebSocketEvent(WebSocketClientEvent.PhoneRegistered, (value: boolean) => {
			isPhoneReg.value = value;
		});

		if (client.phoneIsRegister()) {
			isPhoneReg.value = true;
		}
	};

	const initialize = () => {
		if (initialized.value) return;

		subscribeToPhoneRegistration();

		initialized.value = true;
	};

	return {
		isPhoneReg,
		initialize,
	};
});
