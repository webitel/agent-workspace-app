import { eventBus } from '@webitel/ui-sdk/scripts';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RtpMetrics } from 'webitel-sdk';
import { useWebSocketClient } from '../../../../../app/api/socket/composables/useWebSocketClient';
import { WebSocketClientEvent } from '../../../../../app/api/socket/enums/WebSocketClientEvent.enum';
import { ConnectionQualityLevel } from '../enums/ConnectionQualityLevel.enum';
import { type ConnectionScore, scoreConnection } from '../scoreConnection';

const LATENCY_REFRESH_DELAY = 5000;

let latencyIntervalId: number | null = null;

// https://webitel.atlassian.net/browse/WTEL-8733
export const useWebSocketLatency = () => {
	const latencyRef = ref<number | null>(null);
	const rtpRef = ref<RtpMetrics | null>(null);

	const { t } = useI18n();
	const { on: onWebSocketEvent, latency } = useWebSocketClient();

	onWebSocketEvent(WebSocketClientEvent.CallMediaMetric, (rtp: RtpMetrics) => {
		websocketRtpConnectionLevelHandler(rtp);
	});

	onWebSocketEvent(WebSocketClientEvent.Disconnected, () => {
		stopLatencyTracking();
		latencyRef.value = null;
		rtpRef.value = null;
	});

	const startLatencyTracking = async () => {
		if (latencyIntervalId) {
			console.warn('[WS]: latency tracking already started');
			return;
		}

		latencyIntervalId = window.setInterval(async () => {
			try {
				latencyRef.value = await latency();
			} catch (e) {
				console.warn('[WS] latency error', e);
			}
		}, LATENCY_REFRESH_DELAY);
	};

	const stopLatencyTracking = () => {
		if (latencyIntervalId) {
			window.clearInterval(latencyIntervalId);
			latencyIntervalId = null;
		}
	};

	const websocketRtpConnectionLevelHandler = (
		rtp?: RtpMetrics,
	): ConnectionScore => {
		const score = scoreConnection(rtp);

		if (rtp) rtpRef.value = rtp;

		if (score.level === ConnectionQualityLevel.Low) {
			eventBus.$emit('notification', {
				type: 'error',
				text: t(
					`notifications.connectionQuality.${ConnectionQualityLevel.Low}`,
				),
				timeout: 8000,
			});
		} else if (score.level === ConnectionQualityLevel.Medium) {
			eventBus.$emit('notification', {
				type: 'warning',
				text: t(
					`notifications.connectionQuality.${ConnectionQualityLevel.Medium}`,
				),
				timeout: 8000,
			});
		}

		return score;
	};

	return {
		startLatencyTracking,
		stopLatencyTracking,
		websocketRtpConnectionLevelHandler,
	};
};
