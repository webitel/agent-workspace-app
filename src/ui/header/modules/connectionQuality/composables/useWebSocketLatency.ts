import { eventBus } from '@webitel/ui-sdk/scripts';
import type { RtpMetrics } from 'webitel-sdk';
import { ConnectionQualityLevel } from '../enums/ConnectionQualityLevel.enum';
import { useI18n } from 'vue-i18n';
import { useWebSocketClient } from '../../../../../app/api/socket/useWebSocketClient';
import { WebSocketClientEvent } from '../../../../../app/api/socket/enums/WebSocketClientEvent.enum';
import { ref } from 'vue';

const LATENCY_REFRESH_DELAY = 5000;

let latencyIntervalId: number | null = null;

export const useWebSocketLatency = () => {
	const latencyRef = ref<number | null>(null);
	const rtpRef = ref<RtpMetrics | null>(null);

	const { t } = useI18n();
	const { on: onWebSocketEvent, getCliInstance } = useWebSocketClient();

	onWebSocketEvent(WebSocketClientEvent.CallMediaMetric, (rtp: RtpMetrics) => {
		websocketRtpConnectionLevelHandler(rtp);
	});

	onWebSocketEvent(WebSocketClientEvent.Disconnected, () => {
		stopLatencyTracking();
		latencyRef.value = null;
		rtpRef.value = null;
	});

	const startLatencyTracking = async () => {
		const cli = await getCliInstance();

		if (latencyIntervalId) {
			console.warn('[WS]: latency tracking already started');
			return;
		}

		latencyIntervalId = window.setInterval(async () => {
			try {
				// @ts-ignore should access and overwrite private property!
				latencyRef.value = await cli.latency();
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
	): {
		level: ConnectionQualityLevel;
		reasons: string[];
	} => {
		if (!rtp) {
			return {
				level: ConnectionQualityLevel.High,
				reasons: [],
			};
		}

		rtpRef.value = rtp;

		const jitterAvg = rtp.jitter?.average ?? 0;
		const packetLossAvg = rtp.packetloss?.average ?? 0;
		const mosAvg = rtp.mos?.average ?? 5;

		let level: ConnectionQualityLevel = ConnectionQualityLevel.High;
		const reasons: string[] = [];

		if (jitterAvg > 50) {
			level = ConnectionQualityLevel.Low;
			reasons.push(`jitter ${Math.round(jitterAvg)} ms (> 50)`);
		} else if (jitterAvg >= 30) {
			level = ConnectionQualityLevel.Medium;
			reasons.push(`jitter ${Math.round(jitterAvg)} ms (30–50)`);
		}

		if (packetLossAvg > 3) {
			level = ConnectionQualityLevel.Low;
			reasons.push(`packet loss ${packetLossAvg.toFixed(1)} % (> 3%)`);
		} else if (packetLossAvg > 1) {
			level = ConnectionQualityLevel.Medium;
			reasons.push(`packet loss ${packetLossAvg.toFixed(1)} % (1–3%)`);
		}

		if (mosAvg < 3.5) {
			level = ConnectionQualityLevel.Low;
			reasons.push(`MOS ${mosAvg.toFixed(2)} (< 3.5)`);
		} else if (mosAvg < 4.0) {
			level = ConnectionQualityLevel.Medium;
			reasons.push(`MOS ${mosAvg.toFixed(2)} (3.5–4.0)`);
		}

		if (level === ConnectionQualityLevel.Low) {
			eventBus.$emit('notification', {
				type: 'error',
				text: t(
					`notifications.connectionQuality.${ConnectionQualityLevel.Low}`,
				),
				timeout: 8000,
			});
		} else if (level === ConnectionQualityLevel.Medium) {
			eventBus.$emit('notification', {
				type: 'warning',
				text: t(
					`notifications.connectionQuality.${ConnectionQualityLevel.Medium}`,
				),
				timeout: 8000,
			});
		}

		return {
			level,
			reasons,
		};
	};

	return {
		startLatencyTracking,
		stopLatencyTracking,
		websocketRtpConnectionLevelHandler,
	};
};
