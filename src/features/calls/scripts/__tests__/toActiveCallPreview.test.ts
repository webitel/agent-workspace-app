import { describe, expect, it, vi } from 'vitest';
import type { Call } from 'webitel-sdk';

import { toActiveCallPreview } from '../toActiveCallPreview';

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
		isHold: false,
		muted: false,
		...overrides,
	}) as unknown as Call;

describe('toActiveCallPreview', () => {
	it('maps an identified contact with its queue', () => {
		expect(toActiveCallPreview(buildCall())).toEqual({
			name: 'Emily Johnson',
			number: '+12023417842',
			queueName: 'Sales',
			answeredAt: 1_700_000_000_000,
			isHold: false,
			isMuted: false,
		});
	});

	it('leaves the name out when the contact was not identified', () => {
		expect(
			toActiveCallPreview(
				buildCall({
					displayName: '',
				}),
			).name,
		).toBeUndefined();
	});

	it('leaves the name out when the platform hides the contact', () => {
		expect(
			toActiveCallPreview(
				buildCall({
					hideContact: true,
				}),
			).name,
		).toBeUndefined();
	});

	it('masks the number when the platform hides it', () => {
		expect(
			toActiveCallPreview(
				buildCall({
					hideNumber: true,
				}),
			).number,
		).toBe('*****842');
	});

	it('leaves the queue out for a call outside a queue', () => {
		expect(
			toActiveCallPreview(
				buildCall({
					queue: null,
				}),
			).queueName,
		).toBeUndefined();
	});

	it('carries the hold and mute state', () => {
		const preview = toActiveCallPreview(
			buildCall({
				isHold: true,
				muted: true,
			}),
		);

		expect(preview.isHold).toBe(true);
		expect(preview.isMuted).toBe(true);
	});
});
