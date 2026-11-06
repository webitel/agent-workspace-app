import { describe, expect, it, vi } from 'vitest';
import type { Call } from 'webitel-sdk';

import { getCallContactId } from '../getCallContactId';

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		id: 'call-1',
		bridgedId: '',
		contact: null,
		...overrides,
	}) as unknown as Call;

const noCalls = () => undefined;

describe('getCallContactId', () => {
	it('returns the contact linked to the call as a string', () => {
		const call = buildCall({
			contact: {
				id: 42,
				hide: false,
			},
		});

		expect(getCallContactId(call, noCalls)).toBe('42');
	});

	it('prefers the call own contact over the bridged one', () => {
		const getCallById = vi.fn();
		const call = buildCall({
			bridgedId: 'call-2',
			contact: {
				id: 42,
				hide: false,
			},
		});

		expect(getCallContactId(call, getCallById)).toBe('42');
		expect(getCallById).not.toHaveBeenCalled();
	});

	it('takes the contact of the bridged call when the call has none', () => {
		const bridgedCall = buildCall({
			id: 'call-2',
			contact: {
				id: 7,
				hide: false,
			},
		});
		const call = buildCall({
			bridgedId: 'call-2',
			contact: {
				id: null,
				hide: false,
			},
		});

		expect(
			getCallContactId(call, (id) =>
				id === 'call-2' ? bridgedCall : undefined,
			),
		).toBe('7');
	});

	it('is undefined when the bridged call is not in the store', () => {
		const call = buildCall({
			bridgedId: 'call-2',
		});

		expect(getCallContactId(call, noCalls)).toBeUndefined();
	});

	it('is undefined when the bridged call has no contact either', () => {
		const bridgedCall = buildCall({
			id: 'call-2',
		});
		const call = buildCall({
			bridgedId: 'call-2',
		});

		expect(getCallContactId(call, () => bridgedCall)).toBeUndefined();
	});

	it('is undefined for a call with no contact and no bridge', () => {
		expect(getCallContactId(buildCall(), noCalls)).toBeUndefined();
	});
});
