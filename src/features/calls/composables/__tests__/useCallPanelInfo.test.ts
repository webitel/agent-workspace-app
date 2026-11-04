import { FormatDateMode, IconColor } from '@webitel/ui-sdk/enums';
import { formatDate } from '@webitel/ui-sdk/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';
import { CallDirection } from 'webitel-sdk';

import type { CallPanelInfo } from '../../types/CallPanelInfo.types';
import { useCallPanelInfo } from '../useCallPanelInfo';

const CREATED_AT = 1_700_000_000_000;
const ANSWERED_AT = CREATED_AT + 15_000;

const buildInfo = (overrides: Partial<CallPanelInfo> = {}): CallPanelInfo => ({
	direction: CallDirection.Inbound,
	from: '+12023417842',
	to: '1001',
	queueName: 'Sales',
	createdAt: CREATED_AT,
	answeredAt: ANSWERED_AT,
	...overrides,
});

function setup(info: CallPanelInfo) {
	const infoRef = ref(info);
	const scope = effectScope();
	const result = scope.run(() => useCallPanelInfo(infoRef));
	if (!result) throw new Error('useCallPanelInfo scope did not run');
	return {
		...result,
		infoRef,
		scope,
	};
}

describe('useCallPanelInfo', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(ANSWERED_AT + 65_000);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('gives the inbound view', () => {
		const { view, scope } = setup(buildInfo());

		expect(view.value).toMatchObject({
			icon: 'ws-inbound-call',
			iconColor: IconColor.SUCCESS,
		});
		expect(view.value?.title()).toBe('ui.call.direction.inbound');
		scope.stop();
	});

	it('gives no view for a direction without an entry', () => {
		const { view, rows, scope } = setup(
			buildInfo({
				direction: CallDirection.Outbound,
			}),
		);

		expect(view.value).toBeUndefined();
		expect(rows.value).toEqual([]);
		scope.stop();
	});

	it('lists the inbound fields in order', () => {
		const { rows, scope } = setup(buildInfo());

		expect(rows.value).toEqual([
			{
				field: 'from',
				label: 'reusable.from',
				value: '+12023417842',
			},
			{
				field: 'to',
				label: 'reusable.to',
				value: '1001',
			},
			{
				field: 'queue',
				label: 'objects.queue.queue',
				value: 'Sales',
			},
		]);
		scope.stop();
	});

	it('leaves out the fields the call does not have', () => {
		const { rows, scope } = setup(
			buildInfo({
				to: undefined,
				queueName: undefined,
			}),
		);

		expect(rows.value.map(({ field }) => field)).toEqual([
			'from',
		]);
		scope.stop();
	});

	it('formats the start time, and has none without one', () => {
		const { startedAt, infoRef, scope } = setup(buildInfo());

		expect(startedAt.value).toBe(
			`ui.reusable.startedAt: ${formatDate(CREATED_AT, FormatDateMode.TIME_SEC)}`,
		);

		infoRef.value = buildInfo({
			createdAt: undefined,
		});
		expect(startedAt.value).toBeUndefined();
		scope.stop();
	});

	it('counts the duration from the answer time', () => {
		const { duration, scope } = setup(buildInfo());

		expect(duration.value).toBe('00:01:05');
		scope.stop();
	});

	it('follows the info when it changes', () => {
		const { rows, infoRef, scope } = setup(buildInfo());

		infoRef.value = buildInfo({
			queueName: 'Support',
		});
		expect(rows.value.at(-1)?.value).toBe('Support');
		scope.stop();
	});
});
