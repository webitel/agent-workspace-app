import { describe, expect, it, vi } from 'vitest';
import type { Call } from 'webitel-sdk';

import { toActiveCallContent } from '../toActiveCallContent';

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
		displayName: 'Emily Johnson',
		displayNumber: '+12023417842',
		hideContact: false,
		hideNumber: false,
		queue: {
			queue_name: 'Sales',
		},
		answeredAt: 1_700_000_000_000,
		hangupAt: 0,
		allowTransfer: true,
		isHold: false,
		muted: false,
		digits: [],
		...overrides,
	}) as unknown as Call;

describe('toActiveCallContent', () => {
	it('maps an identified contact with its queue', () => {
		expect(toActiveCallContent(buildCall())).toEqual({
			name: 'Emily Johnson',
			number: '+12023417842',
			queueName: 'Sales',
			answeredAt: 1_700_000_000_000,
			isHold: false,
			isMuted: false,
			canTransfer: true,
			dtmfDigits: '',
		});
	});

	it('joins the confirmed DTMF digits in order', () => {
		expect(
			toActiveCallContent(
				buildCall({
					digits: [
						'1',
						'#',
						'0',
					],
				}),
			).dtmfDigits,
		).toBe('1#0');
	});

	it('has no DTMF digits when the call carries none', () => {
		expect(
			toActiveCallContent(
				buildCall({
					digits: undefined,
				}),
			).dtmfDigits,
		).toBe('');
	});

	it('leaves the name out when the contact was not identified', () => {
		expect(
			toActiveCallContent(
				buildCall({
					displayName: '',
				}),
			).name,
		).toBeUndefined();
	});

	it('leaves the name out when the platform hides the contact', () => {
		expect(
			toActiveCallContent(
				buildCall({
					hideContact: true,
				}),
			).name,
		).toBeUndefined();
	});

	it('masks the number when the platform hides it', () => {
		expect(
			toActiveCallContent(
				buildCall({
					hideNumber: true,
				}),
			).number,
		).toBe('*****842');
	});

	it('leaves the queue out for a call outside a queue', () => {
		expect(
			toActiveCallContent(
				buildCall({
					queue: null,
				}),
			).queueName,
		).toBeUndefined();
	});

	it('carries the hold state', () => {
		expect(
			toActiveCallContent(
				buildCall({
					isHold: true,
				}),
			).isHold,
		).toBe(true);
	});

	it('carries the mute state', () => {
		expect(
			toActiveCallContent(
				buildCall({
					muted: true,
				}),
			).isMuted,
		).toBe(true);
	});

	it('is not muted when the call carries no mute state', () => {
		expect(
			toActiveCallContent(
				buildCall({
					muted: undefined,
				}),
			).isMuted,
		).toBe(false);
	});
});
