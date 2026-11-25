import { describe, expect, it } from 'vitest';
import { type Call, CallDirection } from 'webitel-sdk';

import type { OutboundCallAttempt } from '../../types/OutboundCallAttempt.types';
import { linkAttemptsToCalls } from '../linkAttemptsToCalls';

const buildCall = (
	id: string,
	direction: CallDirection = CallDirection.Outbound,
	sipId: string | null = null,
) =>
	({
		id,
		direction,
		sipId,
	}) as unknown as Call;

const buildAttempt = (
	id: string,
	overrides: Partial<OutboundCallAttempt> = {},
): OutboundCallAttempt => ({
	id,
	destination: '100',
	placedCall: null,
	callIdsBeforeDial: new Set(),
	dialedCallIds: {},
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
				callIdsClaimedByDial: new Set(),
				callIdsClaimedByElimination: new Set(),
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
			callIdsClaimedByDial: new Set(),
			callIdsClaimedByElimination: new Set(),
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
			callIdsClaimedByDial: new Set(),
			callIdsClaimedByElimination: new Set(),
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
			callIdsClaimedByDial: new Set(),
			callIdsClaimedByElimination: new Set(),
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
			callIdsClaimedByDial: new Set(),
			callIdsClaimedByElimination: new Set(),
		});

		expect(assignments).toEqual([]);
	});

	it('does not hand out a call whose attempt is already gone', () => {
		const assignments = linkAttemptsToCalls({
			attempts: [
				buildAttempt('attempt-2'),
				buildAttempt('attempt-3'),
			],
			callList: [
				buildCall('call-claimed-by-dial'),
				buildCall('call-claimed-by-elimination'),
			],
			callIdsClaimedByDial: new Set([
				'call-claimed-by-dial',
			]),
			callIdsClaimedByElimination: new Set([
				'call-claimed-by-elimination',
			]),
		});

		expect(assignments).toEqual([]);
	});

	describe('with the ids the dial returned', () => {
		it('takes the call its sip id names, not an earlier one dialled elsewhere', () => {
			const ownCall = buildCall('own-call', CallDirection.Outbound, 'abc');

			const assignments = linkAttemptsToCalls({
				attempts: [
					buildAttempt('attempt-1', {
						dialedCallIds: {
							sipId: 'abcfromtag',
						},
					}),
				],
				callList: [
					buildCall('foreign-call', CallDirection.Outbound, 'xyz'),
					ownCall,
				],
				callIdsClaimedByDial: new Set(),
				callIdsClaimedByElimination: new Set(),
			});

			expect(assignments).toEqual([
				{
					attemptId: 'attempt-1',
					call: ownCall,
				},
			]);
		});

		it('takes the call its call id names', () => {
			const ownCall = buildCall('own-call');

			const assignments = linkAttemptsToCalls({
				attempts: [
					buildAttempt('attempt-1', {
						dialedCallIds: {
							callId: 'own-call',
						},
					}),
				],
				callList: [
					buildCall('foreign-call'),
					ownCall,
				],
				callIdsClaimedByDial: new Set(),
				callIdsClaimedByElimination: new Set(),
			});

			expect(assignments).toEqual([
				{
					attemptId: 'attempt-1',
					call: ownCall,
				},
			]);
		});

		it('waits for its own call instead of adopting one dialled elsewhere', () => {
			const assignments = linkAttemptsToCalls({
				attempts: [
					buildAttempt('attempt-1', {
						dialedCallIds: {
							sipId: 'abcfromtag',
						},
					}),
				],
				callList: [
					buildCall('foreign-call', CallDirection.Outbound, 'xyz'),
				],
				callIdsClaimedByDial: new Set(),
				callIdsClaimedByElimination: new Set(),
			});

			expect(assignments).toEqual([]);
		});

		it('swaps a call taken by elimination for the one its ids name', () => {
			const foreignCall = buildCall(
				'foreign-call',
				CallDirection.Outbound,
				'xyz',
			);
			const ownCall = buildCall('own-call', CallDirection.Outbound, 'abc');

			const assignments = linkAttemptsToCalls({
				attempts: [
					buildAttempt('attempt-1', {
						placedCall: foreignCall,
						dialedCallIds: {
							sipId: 'abcfromtag',
						},
					}),
				],
				callList: [
					foreignCall,
					ownCall,
				],
				callIdsClaimedByDial: new Set(),
				callIdsClaimedByElimination: new Set(),
			});

			expect(assignments).toEqual([
				{
					attemptId: 'attempt-1',
					call: ownCall,
				},
			]);
		});

		it('gives up a call taken by elimination once its ids name another', () => {
			const foreignCall = buildCall(
				'foreign-call',
				CallDirection.Outbound,
				'xyz',
			);

			const assignments = linkAttemptsToCalls({
				attempts: [
					buildAttempt('attempt-1', {
						placedCall: foreignCall,
						dialedCallIds: {
							sipId: 'abcfromtag',
						},
					}),
				],
				callList: [
					foreignCall,
				],
				callIdsClaimedByDial: new Set(),
				callIdsClaimedByElimination: new Set(),
			});

			expect(assignments).toEqual([
				{
					attemptId: 'attempt-1',
					call: null,
				},
			]);
		});

		it('takes the call its ids name from an attempt that took it by elimination', () => {
			const namedCall = buildCall('named-call', CallDirection.Outbound, 'abc');

			const assignments = linkAttemptsToCalls({
				attempts: [
					buildAttempt('attempt-without-ids', {
						placedCall: namedCall,
					}),
					buildAttempt('attempt-with-ids', {
						dialedCallIds: {
							sipId: 'abcfromtag',
						},
					}),
				],
				callList: [
					namedCall,
				],
				callIdsClaimedByDial: new Set(),
				callIdsClaimedByElimination: new Set(),
			});

			expect(assignments).toEqual([
				{
					attemptId: 'attempt-without-ids',
					call: null,
				},
				{
					attemptId: 'attempt-with-ids',
					call: namedCall,
				},
			]);
		});

		it('does not take a call that was listed before it dialled', () => {
			const assignments = linkAttemptsToCalls({
				attempts: [
					buildAttempt('attempt-1', {
						callIdsBeforeDial: new Set([
							'old-call',
						]),
						dialedCallIds: {
							sipId: 'abcfromtag',
						},
					}),
				],
				callList: [
					buildCall('old-call', CallDirection.Outbound, 'abc'),
				],
				callIdsClaimedByDial: new Set(),
				callIdsClaimedByElimination: new Set(),
			});

			expect(assignments).toEqual([]);
		});

		it('keeps its own call once linked', () => {
			const ownCall = buildCall('own-call', CallDirection.Outbound, 'abc');

			const assignments = linkAttemptsToCalls({
				attempts: [
					buildAttempt('attempt-1', {
						placedCall: ownCall,
						dialedCallIds: {
							sipId: 'abcfromtag',
						},
					}),
				],
				callList: [
					ownCall,
				],
				callIdsClaimedByDial: new Set(),
				callIdsClaimedByElimination: new Set(),
			});

			expect(assignments).toEqual([]);
		});

		it('does not let an attempt without ids take the call named by another', () => {
			const namedCall = buildCall('named-call', CallDirection.Outbound, 'abc');

			const assignments = linkAttemptsToCalls({
				attempts: [
					buildAttempt('attempt-without-ids'),
					buildAttempt('attempt-with-ids', {
						dialedCallIds: {
							sipId: 'abcfromtag',
						},
					}),
				],
				callList: [
					namedCall,
				],
				callIdsClaimedByDial: new Set(),
				callIdsClaimedByElimination: new Set(),
			});

			expect(assignments).toEqual([
				{
					attemptId: 'attempt-with-ids',
					call: namedCall,
				},
			]);
		});

		it('takes the call its ids name from an attempt that is gone and had it by elimination', () => {
			const namedCall = buildCall('named-call', CallDirection.Outbound, 'abc');

			const assignments = linkAttemptsToCalls({
				attempts: [
					buildAttempt('attempt-with-ids', {
						dialedCallIds: {
							sipId: 'abcfromtag',
						},
					}),
				],
				callList: [
					namedCall,
				],
				callIdsClaimedByDial: new Set(),
				callIdsClaimedByElimination: new Set([
					'named-call',
				]),
			});

			expect(assignments).toEqual([
				{
					attemptId: 'attempt-with-ids',
					call: namedCall,
				},
			]);
		});

		it('does not take a call another dial named', () => {
			const assignments = linkAttemptsToCalls({
				attempts: [
					buildAttempt('attempt-with-ids', {
						dialedCallIds: {
							sipId: 'abcfromtag',
						},
					}),
				],
				callList: [
					buildCall('named-call', CallDirection.Outbound, 'abc'),
				],
				callIdsClaimedByDial: new Set([
					'named-call',
				]),
				callIdsClaimedByElimination: new Set(),
			});

			expect(assignments).toEqual([]);
		});
	});
});
