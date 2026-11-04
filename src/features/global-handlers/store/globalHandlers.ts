import { defineStore } from 'pinia';
import { ref } from 'vue';

import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import { WebSocketClientEvent } from '../../../app/api/socket/enums/WebSocketClientEvent.enum';
import { useSystemSettingsStore } from '../../system-settings/store/systemSettings';

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

	const subscribeToSystemSettings = () => {
		const systemSettingsStore = useSystemSettingsStore();

		onWebSocketEvent(
			WebSocketClientEvent.SystemSettingsChanged,
			systemSettingsStore.applyChange,
		);
		// [Claude] initialize() runs after the first connect, so AfterAuth here is a reconnect:
		// changes made while the socket was down were never delivered
		onWebSocketEvent(WebSocketClientEvent.AfterAuth, () => {
			systemSettingsStore.reload().catch((err) => {
				console.warn('[global-handlers] system settings reload failed', err);
			});
		});

		systemSettingsStore.initialize().catch((err) => {
			console.warn('[global-handlers] system settings load failed', err);
		});
	};

	const initialize = () => {
		if (initialized.value) return;

		subscribeToPhoneRegistration();
		subscribeToSystemSettings();

		initialized.value = true;
	};

	return {
		isPhoneReg,
		initialize,
	};
});
