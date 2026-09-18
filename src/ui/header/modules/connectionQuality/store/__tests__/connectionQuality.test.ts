import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RtpMetrics } from 'webitel-sdk';
import { mockEmit as emitMock } from '../../../../../../../test/setup';
import { WebSocketClientEvent } from '../../../../../../app/api/socket/enums/WebSocketClientEvent.enum';
import { ConnectionQualityLevel } from '../../enums/ConnectionQualityLevel.enum';

const onMock = vi.fn();
const latencyMock = vi.fn();

vi.mock(
	'../../../../../../app/api/socket/composables/useWebSocketClient',
	() => ({
		useWebSocketClient: () => ({
			on: onMock,
			latency: latencyMock,
		}),
	}),
);

// Store uses `i18n.global.t` directly, not `useI18n()` — the global vue-i18n
// mock in test/setup.ts doesn't cover this import, so it's stubbed here.
vi.mock('../../../../../../app/locale/i18n', () => ({
	default: {
		global: {
			t: (key: string) => key,
		},
	},
}));

import { useConnectionQualityStore } from '../connectionQuality';

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

/** Grabs the callback the store registered for a given event via onMock. */
function getHandler(event: string) {
	const call = onMock.mock.calls.find(([e]) => e === event);
	if (!call) throw new Error(`no handler registered for ${event}`);
	return call[1] as (payload?: unknown) => void;
}

describe('useConnectionQualityStore', () => {
	beforeEach(() => {
		onMock.mockClear();
		latencyMock.mockReset();
		emitMock.mockClear();
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	it('defaults to High before any event arrives', () => {
		const store = useConnectionQualityStore();

		expect(store.level).toBe(ConnectionQualityLevel.High);
	});

	it('subscribes to CallMediaMetric, AfterAuth and Disconnected on initialize', () => {
		const store = useConnectionQualityStore();

		store.initialize();

		expect(onMock).toHaveBeenCalledWith(
			WebSocketClientEvent.CallMediaMetric,
			expect.any(Function),
		);
		expect(onMock).toHaveBeenCalledWith(
			WebSocketClientEvent.AfterAuth,
			expect.any(Function),
		);
		expect(onMock).toHaveBeenCalledWith(
			WebSocketClientEvent.Disconnected,
			expect.any(Function),
		);
	});

	it('does not subscribe twice on repeated initialize', () => {
		const store = useConnectionQualityStore();

		store.initialize();
		store.initialize();

		expect(onMock).toHaveBeenCalledTimes(3);
	});

	describe('rtp -> notification only (never touches level)', () => {
		it('stays silent and level unchanged on healthy metrics', () => {
			const store = useConnectionQualityStore();
			store.initialize();

			getHandler(WebSocketClientEvent.CallMediaMetric)(rtp());

			expect(store.level).toBe(ConnectionQualityLevel.High);
			expect(emitMock).not.toHaveBeenCalled();
		});

		it('emits an error notification on Low rtp quality, level unaffected', () => {
			const store = useConnectionQualityStore();
			store.initialize();

			getHandler(WebSocketClientEvent.CallMediaMetric)(
				rtp({
					jitter: {
						average: 80,
					},
				} as Partial<RtpMetrics>),
			);

			expect(store.level).toBe(ConnectionQualityLevel.High);
			expect(emitMock).toHaveBeenCalledWith('notification', {
				type: 'error',
				text: `notifications.connectionQuality.${ConnectionQualityLevel.Low}`,
				timeout: 8000,
			});
		});

		it('emits a warning notification on Medium rtp quality, level unaffected', () => {
			const store = useConnectionQualityStore();
			store.initialize();

			getHandler(WebSocketClientEvent.CallMediaMetric)(
				rtp({
					jitter: {
						average: 40,
					},
				} as Partial<RtpMetrics>),
			);

			expect(store.level).toBe(ConnectionQualityLevel.High);
			expect(emitMock).toHaveBeenCalledWith('notification', {
				type: 'warning',
				text: `notifications.connectionQuality.${ConnectionQualityLevel.Medium}`,
				timeout: 8000,
			});
		});
	});

	describe('latency -> level (icon)', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});
		afterEach(() => {
			vi.useRealTimers();
		});

		it('starts polling latency after AfterAuth and maps Low correctly', async () => {
			latencyMock.mockResolvedValue(350); // > 300 -> Low
			const store = useConnectionQualityStore();
			store.initialize();

			getHandler(WebSocketClientEvent.AfterAuth)();
			await vi.advanceTimersByTimeAsync(5000);

			expect(latencyMock).toHaveBeenCalled();
			expect(store.level).toBe(ConnectionQualityLevel.Low);
		});

		it('maps medium latency correctly', async () => {
			latencyMock.mockResolvedValue(200); // 150-300 -> Medium
			const store = useConnectionQualityStore();
			store.initialize();

			getHandler(WebSocketClientEvent.AfterAuth)();
			await vi.advanceTimersByTimeAsync(5000);

			expect(store.level).toBe(ConnectionQualityLevel.Medium);
		});

		it('maps healthy latency to High', async () => {
			latencyMock.mockResolvedValue(50);
			const store = useConnectionQualityStore();
			store.initialize();

			getHandler(WebSocketClientEvent.AfterAuth)();
			await vi.advanceTimersByTimeAsync(5000);

			expect(store.level).toBe(ConnectionQualityLevel.High);
		});

		it('does not start a second interval on repeated AfterAuth (e.g. reconnect noise)', async () => {
			latencyMock.mockResolvedValue(50);
			const store = useConnectionQualityStore();
			store.initialize();

			const afterAuth = getHandler(WebSocketClientEvent.AfterAuth);
			afterAuth();
			afterAuth();

			latencyMock.mockClear();
			await vi.advanceTimersByTimeAsync(5000);

			expect(latencyMock).toHaveBeenCalledTimes(1);
		});

		it('stops polling and resets level to High on Disconnected', async () => {
			latencyMock.mockResolvedValue(350);
			const store = useConnectionQualityStore();
			store.initialize();

			getHandler(WebSocketClientEvent.AfterAuth)();
			await vi.advanceTimersByTimeAsync(5000);
			expect(store.level).toBe(ConnectionQualityLevel.Low);

			getHandler(WebSocketClientEvent.Disconnected)();
			expect(store.level).toBe(ConnectionQualityLevel.High);

			latencyMock.mockClear();
			await vi.advanceTimersByTimeAsync(10000);
			expect(latencyMock).not.toHaveBeenCalled();
		});

		it('resumes polling after Disconnected -> AfterAuth (reconnect)', async () => {
			latencyMock.mockResolvedValue(50);
			const store = useConnectionQualityStore();
			store.initialize();

			getHandler(WebSocketClientEvent.AfterAuth)();
			await vi.advanceTimersByTimeAsync(5000);
			expect(latencyMock).toHaveBeenCalledTimes(1);

			getHandler(WebSocketClientEvent.Disconnected)();
			getHandler(WebSocketClientEvent.AfterAuth)(); // reconnect

			latencyMock.mockClear();
			await vi.advanceTimersByTimeAsync(5000);

			expect(latencyMock).toHaveBeenCalledTimes(1);
		});
	});
});
