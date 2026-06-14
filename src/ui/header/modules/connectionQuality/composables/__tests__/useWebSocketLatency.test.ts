import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RtpMetrics } from 'webitel-sdk';
import { mockEmit as emitMock } from '../../../../../../../test/setup';
import { ConnectionQualityLevel } from '../../enums/ConnectionQualityLevel.enum';

const onMock = vi.fn();
const latencyMock = vi.fn();

// vue-i18n + eventBus are mocked globally in src/test/setup.ts
// (t echoes the key back; eventBus.$emit -> mockEmit)

vi.mock(
	'../../../../../../app/api/socket/composables/useWebSocketClient',
	() => ({
		useWebSocketClient: () => ({
			on: onMock,
			latency: latencyMock,
		}),
	}),
);

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
		latencyMock.mockReset();
	});

	// Pure scoring (level + reasons) is covered in scoreConnection.test.ts.
	// Here we cover the composable's side effect: the degrade notification.
	describe('connection-quality notification', () => {
		it('stays silent when rtp is missing', () => {
			const { websocketRtpConnectionLevelHandler } = useWebSocketLatency();

			websocketRtpConnectionLevelHandler();

			expect(emitMock).not.toHaveBeenCalled();
		});

		it('stays silent on healthy metrics (High)', () => {
			const { websocketRtpConnectionLevelHandler } = useWebSocketLatency();

			websocketRtpConnectionLevelHandler(rtp());

			expect(emitMock).not.toHaveBeenCalled();
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
	});

	describe('latency tracking', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});
		afterEach(() => {
			vi.useRealTimers();
		});

		it('polls latency on an interval after start', async () => {
			latencyMock.mockResolvedValue(42);

			const { startLatencyTracking, stopLatencyTracking } =
				useWebSocketLatency();

			await startLatencyTracking();
			await vi.advanceTimersByTimeAsync(5000);

			expect(latencyMock).toHaveBeenCalled();
			stopLatencyTracking();
		});

		it('stops polling after stop', async () => {
			latencyMock.mockResolvedValue(42);

			const { startLatencyTracking, stopLatencyTracking } =
				useWebSocketLatency();

			await startLatencyTracking();
			stopLatencyTracking();
			latencyMock.mockClear();
			await vi.advanceTimersByTimeAsync(10000);

			expect(latencyMock).not.toHaveBeenCalled();
		});
	});
});
