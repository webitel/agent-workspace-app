import { describe, expect, it } from 'vitest';
import type { Call } from 'webitel-sdk';

import { toOutboundCallPreview } from '../toOutboundCallPreview';

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		displayName: 'Emily Johnson',
		displayNumber: '+12023417842',
		hideContact: false,
		...overrides,
	}) as unknown as Call;

describe('toOutboundCallPreview', () => {
	it('shows the typed number while the call is being placed', () => {
		expect(toOutboundCallPreview('+1 202 341 7842', null)).toEqual({
			name: undefined,
			number: '+1 202 341 7842',
		});
	});

	it('shows the contact the platform resolved', () => {
		expect(toOutboundCallPreview('+1 202 341 7842', buildCall())).toEqual({
			name: 'Emily Johnson',
			number: '+12023417842',
		});
	});

	it('shows no name when the platform resolved none', () => {
		expect(
			toOutboundCallPreview(
				'100',
				buildCall({
					displayName: '',
				}),
			).name,
		).toBeUndefined();
	});

	it('hides the name when the platform hides the contact', () => {
		expect(
			toOutboundCallPreview(
				'100',
				buildCall({
					hideContact: true,
				}),
			).name,
		).toBeUndefined();
	});

	it('falls back to the typed number when the call has none', () => {
		expect(
			toOutboundCallPreview(
				'100',
				buildCall({
					displayNumber: undefined,
				}),
			).number,
		).toBe('100');
	});
});
