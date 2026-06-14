import type { RtpMetrics } from 'webitel-sdk';
import { ConnectionQualityLevel } from './enums/ConnectionQualityLevel.enum';

export interface ConnectionScore {
	level: ConnectionQualityLevel;
	reasons: string[];
}

/**
 * Pure connection-quality scoring: maps RTP metrics to a quality level and the
 * human-readable reasons behind it. No side effects — the level is the worst of
 * the per-metric verdicts (jitter, packet loss, MOS).
 */
export function scoreConnection(rtp?: RtpMetrics): ConnectionScore {
	if (!rtp) {
		return {
			level: ConnectionQualityLevel.High,
			reasons: [],
		};
	}

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

	return {
		level,
		reasons,
	};
}
