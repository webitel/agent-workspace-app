import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RtpMetrics } from 'webitel-sdk';
import { WebSocketClientEvent } from '../../../../../../app/api/socket/enums/WebSocketClientEvent.enum';
import { ConnectionQualityLevel } from '../../enums/ConnectionQualityLevel.enum';

const onMock = vi.fn();

vi.mock(
	'../../../../../../app/api/socket/composables/useWebSocketClient',
	() => ({
		useWebSocketClient: () => ({
			on: onMock,
		}),
	}),
);

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
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	it('defaults to High before any metric arrives', () => {
		const store = useConnectionQualityStore();

		expect(store.level).toBe(ConnectionQualityLevel.High);
	});

	it('subscribes to CallMediaMetric and Disconnected on initialize', () => {
		const store = useConnectionQualityStore();

		store.initialize();

		expect(onMock).toHaveBeenCalledWith(
			WebSocketClientEvent.CallMediaMetric,
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

		expect(onMock).toHaveBeenCalledTimes(2); // one CallMediaMetric + one Disconnected, not four
	});

	it('updates level to High on a healthy metric', () => {
		const store = useConnectionQualityStore();
		store.initialize();

		getHandler(WebSocketClientEvent.CallMediaMetric)(rtp());

		expect(store.level).toBe(ConnectionQualityLevel.High);
	});

	it('updates level to Medium on degraded metric', () => {
		const store = useConnectionQualityStore();
		store.initialize();

		getHandler(WebSocketClientEvent.CallMediaMetric)(
			rtp({
				jitter: {
					average: 40,
				},
			} as Partial<RtpMetrics>),
		);

		expect(store.level).toBe(ConnectionQualityLevel.Medium);
	});

	it('updates level to Low on poor metric', () => {
		const store = useConnectionQualityStore();
		store.initialize();

		getHandler(WebSocketClientEvent.CallMediaMetric)(
			rtp({
				jitter: {
					average: 80,
				},
			} as Partial<RtpMetrics>),
		);

		expect(store.level).toBe(ConnectionQualityLevel.Low);
	});

	it('resets level to High on Disconnected', () => {
		const store = useConnectionQualityStore();
		store.initialize();

		getHandler(WebSocketClientEvent.CallMediaMetric)(
			rtp({
				jitter: {
					average: 80,
				},
			} as Partial<RtpMetrics>),
		);
		expect(store.level).toBe(ConnectionQualityLevel.Low);

		getHandler(WebSocketClientEvent.Disconnected)();

		expect(store.level).toBe(ConnectionQualityLevel.High);
	});
});
