import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RtpMetrics } from 'webitel-sdk';
import { mockEmit as emitMock } from '../../../../../../../test/setup';
import { ConnectionQualityLevel } from '../../enums/ConnectionQualityLevel.enum';

const onMock = vi.fn();
const getCliInstanceMock = vi.fn();

// vue-i18n + eventBus are mocked globally in src/test/setup.ts
// (t echoes the key back; eventBus.$emit -> mockEmit)

vi.mock('../../../../../../app/api/socket/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		on: onMock,
		getCliInstance: getCliInstanceMock,
	}),
}));

import { useWebSocketLatency } from '../useWebSocketLatency';

const rtp = (over: Partial<RtpMetrics> = {}): RtpMetrics =>
	({
		jitter: {
			average: 0,
		},
		packetloss: {
			average: 0,
		},
		mos: {
			average: 5,
		},
		...over,
	}) as RtpMetrics;

describe('useWebSocketLatency', () => {
	beforeEach(() => {
		onMock.mockClear();
		getCliInstanceMock.mockReset();
	});

	describe('websocketRtpConnectionLevelHandler', () => {
		it('returns High with no reasons when rtp is missing', () => {
			const { websocketRtpConnectionLevelHandler } = useWebSocketLatency();

			expect(websocketRtpConnectionLevelHandler()).toEqual({
				level: ConnectionQualityLevel.High,
				reasons: [],
			});
			expect(emitMock).not.toHaveBeenCalled();
		});

		it('returns High for healthy metrics', () => {
			const { websocketRtpConnectionLevelHandler } = useWebSocketLatency();

			const result = websocketRtpConnectionLevelHandler(rtp());

			expect(result.level).toBe(ConnectionQualityLevel.High);
			expect(result.reasons).toEqual([]);
			expect(emitMock).not.toHaveBeenCalled();
		});

		it('flags Medium on borderline jitter (30–50ms)', () => {
			const { websocketRtpConnectionLevelHandler } = useWebSocketLatency();

			const result = websocketRtpConnectionLevelHandler(
				rtp({
					jitter: {
						average: 40,
					},
				} as Partial<RtpMetrics>),
			);

			expect(result.level).toBe(ConnectionQualityLevel.Medium);
			expect(result.reasons).toContain('jitter 40 ms (30–50)');
		});

		it('flags Low on high jitter (>50ms)', () => {
			const { websocketRtpConnectionLevelHandler } = useWebSocketLatency();

			const result = websocketRtpConnectionLevelHandler(
				rtp({
					jitter: {
						average: 80,
					},
				} as Partial<RtpMetrics>),
			);

			expect(result.level).toBe(ConnectionQualityLevel.Low);
			expect(result.reasons).toContain('jitter 80 ms (> 50)');
		});

		it('flags Low on high packet loss (>3%)', () => {
			const { websocketRtpConnectionLevelHandler } = useWebSocketLatency();

			const result = websocketRtpConnectionLevelHandler(
				rtp({
					packetloss: {
						average: 5,
					},
				} as Partial<RtpMetrics>),
			);

			expect(result.level).toBe(ConnectionQualityLevel.Low);
			expect(result.reasons).toContain('packet loss 5.0 % (> 3%)');
		});

		it('flags Low on poor MOS (<3.5)', () => {
			const { websocketRtpConnectionLevelHandler } = useWebSocketLatency();

			const result = websocketRtpConnectionLevelHandler(
				rtp({
					mos: {
						average: 3.0,
					},
				} as Partial<RtpMetrics>),
			);

			expect(result.level).toBe(ConnectionQualityLevel.Low);
			expect(result.reasons).toContain('MOS 3.00 (< 3.5)');
		});

		it('emits an error notification on Low quality', () => {
			const { websocketRtpConnectionLevelHandler } = useWebSocketLatency();

			websocketRtpConnectionLevelHandler(
				rtp({
					jitter: {
						average: 80,
					},
				} as Partial<RtpMetrics>),
			);

			expect(emitMock).toHaveBeenCalledWith('notification', {
				type: 'error',
				text: `notifications.connectionQuality.${ConnectionQualityLevel.Low}`,
				timeout: 8000,
			});
		});

		it('emits a warning notification on Medium quality', () => {
			const { websocketRtpConnectionLevelHandler } = useWebSocketLatency();

			websocketRtpConnectionLevelHandler(
				rtp({
					jitter: {
						average: 40,
					},
				} as Partial<RtpMetrics>),
			);

			expect(emitMock).toHaveBeenCalledWith('notification', {
				type: 'warning',
				text: `notifications.connectionQuality.${ConnectionQualityLevel.Medium}`,
				timeout: 8000,
			});
		});

		it('falls to worst level when multiple metrics degrade', () => {
			const { websocketRtpConnectionLevelHandler } = useWebSocketLatency();

			const result = websocketRtpConnectionLevelHandler(
				rtp({
					jitter: {
						average: 40,
					}, // medium
					mos: {
						average: 3.0,
					}, // low
				} as Partial<RtpMetrics>),
			);

			expect(result.level).toBe(ConnectionQualityLevel.Low);
			expect(result.reasons.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('latency tracking', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});
		afterEach(() => {
			vi.useRealTimers();
		});

		it('polls cli.latency on an interval after start', async () => {
			const latency = vi.fn().mockResolvedValue(42);
			getCliInstanceMock.mockResolvedValue({
				latency,
			});

			const { startLatencyTracking, stopLatencyTracking } =
				useWebSocketLatency();

			await startLatencyTracking();
			await vi.advanceTimersByTimeAsync(5000);

			expect(latency).toHaveBeenCalled();
			stopLatencyTracking();
		});

		it('stops polling after stop', async () => {
			const latency = vi.fn().mockResolvedValue(42);
			getCliInstanceMock.mockResolvedValue({
				latency,
			});

			const { startLatencyTracking, stopLatencyTracking } =
				useWebSocketLatency();

			await startLatencyTracking();
			stopLatencyTracking();
			latency.mockClear();
			await vi.advanceTimersByTimeAsync(10000);

			expect(latency).not.toHaveBeenCalled();
		});
	});
});
