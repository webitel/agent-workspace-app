import { QueueTypeName } from '@webitel/ui-sdk/enums';
import { describe, expect, it } from 'vitest';
import { type Call, CallDirection } from 'webitel-sdk';

import { isIncomingCallOffer } from '../isIncomingCallOffer';

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		id: 'call-1',
		direction: CallDirection.Inbound,
		allowAnswer: true,
		isEavesdrop: false,
		queue: null,
		params: {},
		...overrides,
	}) as unknown as Call;

describe('isIncomingCallOffer', () => {
	it('offers a plain inbound answerable call', () => {
		expect(isIncomingCallOffer(buildCall())).toBe(true);
	});

	it('does not offer a call the agent cannot answer', () => {
		expect(
			isIncomingCallOffer(
				buildCall({
					allowAnswer: false,
				}),
			),
		).toBe(false);
	});

	it('does not offer an eavesdropped call to a listening supervisor', () => {
		expect(
			isIncomingCallOffer(
				buildCall({
					isEavesdrop: true,
				}),
			),
		).toBe(false);
	});

	it('does not offer a call from an offline (callback) queue', () => {
		expect(
			isIncomingCallOffer(
				buildCall({
					queue: {
						queue_type: QueueTypeName.OFFLINE_QUEUE,
					},
				} as Partial<Call>),
			),
		).toBe(false);
	});

	it('does not offer a manually distributed call', () => {
		expect(
			isIncomingCallOffer(
				buildCall({
					queue: {
						queue_type: QueueTypeName.INBOUND_QUEUE,
						manual_distribution: 'true',
					},
				} as Partial<Call>),
			),
		).toBe(false);
	});

	// the field is a string: 'false' is truthy, so a plain falsy check would
	// wrongly suppress every call from a non-manual queue that sends it explicitly
	it('offers a call whose queue reports manual_distribution as "false"', () => {
		expect(
			isIncomingCallOffer(
				buildCall({
					queue: {
						queue_type: QueueTypeName.INBOUND_QUEUE,
						manual_distribution: 'false',
					},
				} as unknown as Partial<Call>),
			),
		).toBe(true);
	});

	it('offers an outbound preview-dialer leg', () => {
		expect(
			isIncomingCallOffer(
				buildCall({
					direction: CallDirection.Outbound,
					queue: {
						queue_type: QueueTypeName.PREVIEW_DIALER,
					},
				} as Partial<Call>),
			),
		).toBe(true);
	});

	// WTEL-3602: the platform rings the agent's own device first, so this is a
	// genuine incoming leg despite the outbound direction.
	it('offers an outbound leg that still awaits the agent answering', () => {
		expect(
			isIncomingCallOffer(
				buildCall({
					direction: CallDirection.Outbound,
					params: {
						autoAnswer: false,
					},
				}),
			),
		).toBe(true);
	});

	it('does not offer an outbound leg that auto-answers', () => {
		expect(
			isIncomingCallOffer(
				buildCall({
					direction: CallDirection.Outbound,
					params: {
						autoAnswer: true,
					},
				}),
			),
		).toBe(false);
	});

	it('tolerates a missing call', () => {
		expect(isIncomingCallOffer(undefined as unknown as Call)).toBe(false);
	});
});
