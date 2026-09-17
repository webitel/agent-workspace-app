import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RtpMetrics } from 'webitel-sdk';
import { useWebSocketClient } from '../../../../../app/api/socket/composables/useWebSocketClient';
import { WebSocketClientEvent } from '../../../../../app/api/socket/enums/WebSocketClientEvent.enum';
import { ConnectionQualityLevel } from '../enums/ConnectionQualityLevel.enum';
import { scoreConnection } from '../scoreConnection';

export const useConnectionQualityStore = defineStore(
	'connection-quality',
	() => {
		const { on: onWebSocketEvent } = useWebSocketClient();

		const initialized = ref(false);
		const level = ref<ConnectionQualityLevel>(ConnectionQualityLevel.High);

		function subscribeConnectionQuality() {
			onWebSocketEvent(
				WebSocketClientEvent.CallMediaMetric,
				(rtp: RtpMetrics) => {
					level.value = scoreConnection(rtp).level;
				},
			);

			onWebSocketEvent(WebSocketClientEvent.Disconnected, () => {
				level.value = ConnectionQualityLevel.High;
			});
		}

		function initialize() {
			if (initialized.value) return;

			subscribeConnectionQuality();

			initialized.value = true;
		}

		return {
			level,

			initialize,
		};
	},
);
