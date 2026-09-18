import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { describe, expect, it } from 'vitest';

import { mapHistoryCallToRow } from '../mapHistoryCallToRow';

const buildCall = (
	overrides: Partial<EngineHistoryCall> = {},
): EngineHistoryCall => ({
	id: 'call-1',
	destination: '380671234567',
	createdAt: '2026-01-01T10:00:00Z',
	duration: 42,
	...overrides,
});

describe('mapHistoryCallToRow', () => {
	it('prefers the contact name, then the destination name, then the raw destination', () => {
		expect(
			mapHistoryCallToRow(
				buildCall({
					contact: {
						id: 'contact-1',
						name: 'Jane Doe',
					},
					destinationName: 'Some Company',
				}),
			).name,
		).toBe('Jane Doe');

		expect(
			mapHistoryCallToRow(
				buildCall({
					destinationName: 'Some Company',
				}),
			).name,
		).toBe('Some Company');

		expect(mapHistoryCallToRow(buildCall()).name).toBe('380671234567');
	});

	it('falls back to an em dash when nothing identifies the caller', () => {
		expect(
			mapHistoryCallToRow(
				buildCall({
					destination: undefined,
				}),
			).name,
		).toBe('—');
	});

	it('shows "–" when the call has no queue', () => {
		expect(mapHistoryCallToRow(buildCall()).queueName).toBe('–');
	});

	it('carries through the queue name when present', () => {
		expect(
			mapHistoryCallToRow(
				buildCall({
					queue: {
						id: 'queue-1',
						name: 'Sales',
					},
				}),
			).queueName,
		).toBe('Sales');
	});

	it('carries through id, phone number, date and duration as-is', () => {
		const row = mapHistoryCallToRow(buildCall());

		expect(row.id).toBe('call-1');
		expect(row.phoneNumber).toBe('380671234567');
		expect(row.createdAt).toBe('2026-01-01T10:00:00Z');
		expect(row.duration).toBe(42);
	});
});
