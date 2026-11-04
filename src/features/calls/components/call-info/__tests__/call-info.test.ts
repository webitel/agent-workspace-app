import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';
import type { Call } from 'webitel-sdk';

// The table has its own suite; the panel only decides which rows it gets.
vi.mock('../../../../variables/components/variables-table.vue', () => ({
	default: {
		name: 'VariablesTable',
		props: [
			'rows',
		],
		template: '<div />',
	},
}));

import CallInfo from '../call-info.vue';

const makeCall = (variables: Record<string, unknown> | undefined) =>
	reactive({
		id: 'call-1',
		variables,
		task: {
			variables: {
				fromQueue: 'not shown',
			},
		},
	});

const rowsOf = (wrapper: ReturnType<typeof mount>) =>
	wrapper
		.findComponent({
			name: 'VariablesTable',
		})
		.props('rows');

describe('call-info', () => {
	it("shows the call's own variables, not its task's", () => {
		const wrapper = mount(CallInfo, {
			props: {
				call: makeCall({
					Language: 'uk',
					orderId: 42,
				}) as unknown as Call,
			},
		});

		expect(rowsOf(wrapper)).toEqual([
			{
				id: 'call:Language',
				key: 'Language',
				value: 'uk',
			},
			{
				id: 'call:orderId',
				key: 'orderId',
				value: '42',
			},
		]);
	});

	it('shows no rows for a call without variables', () => {
		const wrapper = mount(CallInfo, {
			props: {
				call: makeCall(undefined) as unknown as Call,
			},
		});

		expect(rowsOf(wrapper)).toEqual([]);
	});

	it('follows the variables the SDK sets on bridge', async () => {
		const call = makeCall({
			Language: 'uk',
		});
		const wrapper = mount(CallInfo, {
			props: {
				call: call as unknown as Call,
			},
		});

		call.variables = {
			Language: 'en',
		};
		await nextTick();

		expect(rowsOf(wrapper)).toEqual([
			{
				id: 'call:Language',
				key: 'Language',
				value: 'en',
			},
		]);
	});
});
