import { eventBus } from '@webitel/ui-sdk/scripts';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RtpMetrics } from 'webitel-sdk';
import { useWebSocketClient } from '../../../../../app/api/socket/composables/useWebSocketClient';
import { WebSocketClientEvent } from '../../../../../app/api/socket/enums/WebSocketClientEvent.enum';
import i18n from '../../../../../app/locale/i18n';
import { ConnectionQualityLevel } from '../enums/ConnectionQualityLevel.enum';
import { scoreConnection } from '../scoreConnection';

const LATENCY_REFRESH_DELAY = 5000;
const LATENCY_LOW_THRESHOLD_MS = 300;
const LATENCY_MEDIUM_THRESHOLD_MS = 150;

export const useConnectionQualityStore = defineStore(
	'connection-quality',
	() => {
		const { on: onWebSocketEvent, latency: getLatency } = useWebSocketClient();

		const initialized = ref(false);
		const level = ref<ConnectionQualityLevel>(ConnectionQualityLevel.High);

		let latencyIntervalId: number | null = null;

		function latencyToLevel(ms: number): ConnectionQualityLevel {
			if (ms > LATENCY_LOW_THRESHOLD_MS) return ConnectionQualityLevel.Low;
			if (ms >= LATENCY_MEDIUM_THRESHOLD_MS)
				return ConnectionQualityLevel.Medium;
			return ConnectionQualityLevel.High;
		}

		function startLatencyTracking() {
			if (latencyIntervalId) {
				console.warn('[connectionQuality]: latency tracking already started');
				return;
			}

			latencyIntervalId = window.setInterval(async () => {
				try {
					const ms = await getLatency();
					level.value = latencyToLevel(ms);
				} catch (e) {
					console.warn('[connectionQuality] latency error', e);
				}
			}, LATENCY_REFRESH_DELAY);
		}

		function stopLatencyTracking() {
			if (latencyIntervalId) {
				window.clearInterval(latencyIntervalId);
				latencyIntervalId = null;
			}
		}

		// RTP metrics arrive once, after a call ends (call_media_metric). They only
		// drive a one-off post-call notification — they never set `level` (icon
		// color stays latency-only).
		function notifyIfDegraded(rtpLevel: ConnectionQualityLevel) {
			if (rtpLevel === ConnectionQualityLevel.Low) {
				eventBus.$emit('notification', {
					type: 'error',
					text: i18n.global.t(
						`notifications.connectionQuality.${ConnectionQualityLevel.Low}`,
					),
					timeout: 8000,
				});
			} else if (rtpLevel === ConnectionQualityLevel.Medium) {
				eventBus.$emit('notification', {
					type: 'warning',
					text: i18n.global.t(
						`notifications.connectionQuality.${ConnectionQualityLevel.Medium}`,
					),
					timeout: 8000,
				});
			}
		}

		function subscribeConnectionQuality() {
			onWebSocketEvent(
				WebSocketClientEvent.CallMediaMetric,
				(rtp: RtpMetrics) => {
					notifyIfDegraded(scoreConnection(rtp).level);
				},
			);

			onWebSocketEvent(WebSocketClientEvent.AfterAuth, () => {
				startLatencyTracking();
			});

			onWebSocketEvent(WebSocketClientEvent.Disconnected, () => {
				stopLatencyTracking();
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
