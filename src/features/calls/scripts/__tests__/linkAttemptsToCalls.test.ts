import { describe, expect, it } from 'vitest';
import { type Call, CallDirection } from 'webitel-sdk';

import type { OutboundCallAttempt } from '../../types/OutboundCallAttempt.types';
import { linkAttemptsToCalls } from '../linkAttemptsToCalls';

const buildCall = (
	id: string,
	direction: CallDirection = CallDirection.Outbound,
) =>
	({
		id,
		direction,
	}) as unknown as Call;

const buildAttempt = (
	id: string,
	overrides: Partial<OutboundCallAttempt> = {},
): OutboundCallAttempt => ({
	id,
	destination: '100',
	placedCall: null,
	callIdsBeforeDial: new Set(),
	isHangupRequested: false,
	...overrides,
});

describe('linkAttemptsToCalls', () => {
	it('links nothing when there are no attempts', () => {
		expect(
			linkAttemptsToCalls({
				attempts: [],
				callList: [
					buildCall('call-1'),
				],
				claimedCallIds: new Set(),
			}),
		).toEqual([]);
	});

	it('links an attempt to the new outbound call', () => {
		const call = buildCall('call-1');

		const assignments = linkAttemptsToCalls({
			attempts: [
				buildAttempt('attempt-1'),
			],
			callList: [
				call,
			],
			claimedCallIds: new Set(),
		});

		expect(assignments).toEqual([
			{
				attemptId: 'attempt-1',
				call,
			},
		]);
	});

	it('skips inbound calls and calls that existed before dialling', () => {
		const assignments = linkAttemptsToCalls({
			attempts: [
				buildAttempt('attempt-1', {
					callIdsBeforeDial: new Set([
						'old-call',
					]),
				}),
			],
			callList: [
				buildCall('old-call'),
				buildCall('inbound-call', CallDirection.Inbound),
			],
			claimedCallIds: new Set(),
		});

		expect(assignments).toEqual([]);
	});

	it('serves attempts in dialling order', () => {
		const firstCall = buildCall('call-1');
		const secondCall = buildCall('call-2');

		const assignments = linkAttemptsToCalls({
			attempts: [
				buildAttempt('attempt-1'),
				buildAttempt('attempt-2'),
			],
			callList: [
				firstCall,
				secondCall,
			],
			claimedCallIds: new Set(),
		});

		expect(assignments).toEqual([
			{
				attemptId: 'attempt-1',
				call: firstCall,
			},
			{
				attemptId: 'attempt-2',
				call: secondCall,
			},
		]);
	});

	it('does not hand out a call that another attempt already owns', () => {
		const ownedCall = buildCall('call-1');

		const assignments = linkAttemptsToCalls({
			attempts: [
				buildAttempt('attempt-1', {
					placedCall: ownedCall,
				}),
				buildAttempt('attempt-2'),
			],
			callList: [
				ownedCall,
			],
			claimedCallIds: new Set(),
		});

		expect(assignments).toEqual([]);
	});

	it('does not hand out a call whose attempt is already gone', () => {
		const assignments = linkAttemptsToCalls({
			attempts: [
				buildAttempt('attempt-2'),
			],
			callList: [
				buildCall('call-1'),
			],
			claimedCallIds: new Set([
				'call-1',
			]),
		});

		expect(assignments).toEqual([]);
	});
});
