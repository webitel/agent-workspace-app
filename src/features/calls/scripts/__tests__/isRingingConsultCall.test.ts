import { describe, expect, it } from 'vitest';
import { type Call, CallDirection } from 'webitel-sdk';

import { isRingingConsultCall } from '../isRingingConsultCall';

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		id: 'consult-call',
		parentId: 'original-call',
		direction: CallDirection.Outbound,
		answeredAt: 0,
		hangupAt: 0,
		...overrides,
	}) as unknown as Call;

const originalCall = buildCall({
	id: 'original-call',
	parentId: undefined,
	direction: CallDirection.Inbound,
	answeredAt: 1_700_000_000_000,
});

describe('isRingingConsultCall', () => {
	it('is true for an unanswered outbound call whose parent is listed', () => {
		const consultCall = buildCall();

		expect(
			isRingingConsultCall(consultCall, [
				originalCall,
				consultCall,
			]),
		).toBe(true);
	});

	it('is false once the destination answered', () => {
		const consultCall = buildCall({
			answeredAt: 1_700_000_005_000,
		});

		expect(
			isRingingConsultCall(consultCall, [
				originalCall,
				consultCall,
			]),
		).toBe(false);
	});

	it('is false once the consult call ended', () => {
		const consultCall = buildCall({
			hangupAt: 1_700_000_005_000,
		});

		expect(
			isRingingConsultCall(consultCall, [
				originalCall,
				consultCall,
			]),
		).toBe(false);
	});

	it('is false for a call without a parent', () => {
		const dialedCall = buildCall({
			parentId: undefined,
		});

		expect(
			isRingingConsultCall(dialedCall, [
				originalCall,
				dialedCall,
			]),
		).toBe(false);
	});

	it('is false when the parent is not in the list', () => {
		const consultCall = buildCall();

		expect(
			isRingingConsultCall(consultCall, [
				consultCall,
			]),
		).toBe(false);
	});

	it('is false for an inbound call that carries a parent', () => {
		const inboundCall = buildCall({
			direction: CallDirection.Inbound,
		});

		expect(
			isRingingConsultCall(inboundCall, [
				originalCall,
				inboundCall,
			]),
		).toBe(false);
	});

	it('is false for a missing call', () => {
		expect(
			isRingingConsultCall(undefined, [
				originalCall,
			]),
		).toBe(false);
	});
});
