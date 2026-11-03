import { describe, expect, it, vi } from 'vitest';
import { type Call, CallDirection } from 'webitel-sdk';

import { toCallPanelInfo } from '../toCallPanelInfo';

// the shared i18n instance can't be constructed under the global vue-i18n mock
vi.mock('../../../../app/locale/i18n', () => ({
	default: {
		global: {
			t: (key: string) => key,
		},
	},
}));

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		direction: CallDirection.Inbound,
		from: {
			type: 'dest',
			number: '+12023417842',
		},
		to: {
			type: 'user',
			number: '1001',
		},
		hideNumber: false,
		queue: {
			queue_name: 'Sales',
		},
		createdAt: 1_700_000_000_000,
		answeredAt: 1_700_000_015_000,
		...overrides,
	}) as unknown as Call;

describe('toCallPanelInfo', () => {
	it('maps an inbound call', () => {
		expect(toCallPanelInfo(buildCall())).toEqual({
			direction: CallDirection.Inbound,
			from: '+12023417842',
			to: '1001',
			queueName: 'Sales',
			createdAt: 1_700_000_000_000,
			answeredAt: 1_700_000_015_000,
		});
	});

	it('masks the caller on an inbound call with a hidden number', () => {
		const info = toCallPanelInfo(
			buildCall({
				hideNumber: true,
			}),
		);

		expect(info.from).toBe('*****842');
		expect(info.to).toBe('1001');
	});

	it('masks the callee on an outbound call with a hidden number', () => {
		const info = toCallPanelInfo(
			buildCall({
				direction: CallDirection.Outbound,
				from: {
					type: 'user',
					number: '1001',
				},
				to: {
					type: 'dest',
					number: '+12023417842',
				},
				hideNumber: true,
			}),
		);

		expect(info.from).toBe('1001');
		expect(info.to).toBe('*****842');
	});

	it('leaves out what the call does not have', () => {
		const info = toCallPanelInfo(
			buildCall({
				from: {
					type: 'dest',
					number: '',
				},
				to: undefined,
				queue: null,
				createdAt: 0,
				answeredAt: 0,
			}),
		);

		expect(info).toEqual({
			direction: CallDirection.Inbound,
			from: undefined,
			to: undefined,
			queueName: undefined,
			createdAt: undefined,
			answeredAt: undefined,
		});
	});

	it('leaves out a direction the SDK does not know', () => {
		const info = toCallPanelInfo(
			buildCall({
				direction: 'internal',
			}),
		);

		expect(info.direction).toBeUndefined();
	});
});
