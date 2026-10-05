import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { SortSymbols } from '@webitel/ui-sdk/scripts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, KeepAlive, nextTick, reactive, ref } from 'vue';

const locateVariablesMock = vi.fn();

vi.mock('../../../api/chatSdk', () => ({
	threadsService: {
		locateVariables: (...args: unknown[]) => locateVariablesMock(...args),
	},
	messagesService: {},
}));

// The real table pulls in PrimeVue; the panel only needs rows in, sort events out.
vi.mock('@webitel/ui-sdk/components', () => ({
	WtTable: {
		name: 'WtTable',
		props: {
			data: Array,
			headers: Array,
			dataKey: String,
			sortable: Boolean,
		},
		emits: [
			'sort',
		],
		template: `<table>
			<tr v-for="row in data" :key="row[dataKey]" class="row">
				<td class="row-key">{{ row.key }}</td>
				<td class="row-value">{{ row.value }}</td>
			</tr>
		</table>`,
	},
	WtLoader: {
		name: 'WtLoader',
		template: '<div class="loader" />',
	},
	WtEmpty: {
		name: 'WtEmpty',
		props: [
			'text',
		],
		template: '<div class="empty">{{ text }}</div>',
	},
	WtMessage: {
		name: 'WtMessage',
		template: '<div class="message"><slot /></div>',
	},
	WtButton: {
		name: 'WtButton',
		emits: [
			'click',
		],
		template:
			'<button class="retry" @click="$emit(\'click\')"><slot /></button>',
	},
}));

import ChatInfo from '../chat-info.vue';

const taskWith = (variables: Record<string, unknown>) =>
	reactive({
		variables,
	}) as never;

const threadVariables = (variables: Record<string, unknown>) => ({
	variables: Object.fromEntries(
		Object.entries(variables).map(([key, value]) => [
			key,
			{
				value,
			},
		]),
	),
});

/** Mounts the panel under KeepAlive, as the chat window does. */
function mountInfo(props: { task?: unknown; threadId?: string } = {}) {
	const propsRef = reactive({
		threadId: 'thread-1',
		...props,
	});
	const isShown = ref(true);

	const Host = defineComponent({
		setup: () => () =>
			h(
				KeepAlive,
				{},
				{
					default: () =>
						isShown.value
							? h(ChatInfo, propsRef as never)
							: h('div', {
									class: 'other-tab',
								}),
				},
			),
	});

	return {
		wrapper: mount(Host, {
			global: {
				plugins: [
					createTestingPinia({
						stubActions: false,
						createSpy: vi.fn,
					}),
				],
			},
		}),
		propsRef,
		isShown,
	};
}

const rowsOf = (wrapper: ReturnType<typeof mountInfo>['wrapper']) =>
	wrapper.findAll('.row').map((row) => ({
		key: row.find('.row-key').text(),
		value: row.find('.row-value').text(),
	}));

describe('chat-info', () => {
	beforeEach(() => {
		locateVariablesMock.mockReset();
		locateVariablesMock.mockResolvedValue(threadVariables({}));
	});

	it('lists the task variables, then the thread variables', async () => {
		locateVariablesMock.mockResolvedValue(
			threadVariables({
				Region: 'EU',
			}),
		);
		const { wrapper } = mountInfo({
			task: taskWith({
				CustomerID: '458732',
			}),
		});
		await flushPromises();

		expect(rowsOf(wrapper)).toEqual([
			{
				key: 'CustomerID',
				value: '458732',
			},
			{
				key: 'Region',
				value: 'EU',
			},
		]);
	});

	it('shows both rows when a key comes from both sources', async () => {
		locateVariablesMock.mockResolvedValue(
			threadVariables({
				Language: 'UK',
			}),
		);
		const { wrapper } = mountInfo({
			task: taskWith({
				Language: 'EN',
			}),
		});
		await flushPromises();

		expect(rowsOf(wrapper).map((row) => row.value)).toEqual([
			'EN',
			'UK',
		]);
	});

	it('reads the thread variables when the tab is shown, and again on every return to it', async () => {
		const { wrapper, isShown } = mountInfo();
		await flushPromises();
		expect(locateVariablesMock).toHaveBeenCalledTimes(1);
		expect(locateVariablesMock).toHaveBeenCalledWith('thread-1');

		locateVariablesMock.mockResolvedValue(
			threadVariables({
				Region: 'changed meanwhile',
			}),
		);
		isShown.value = false;
		await nextTick();
		isShown.value = true;
		await flushPromises();

		expect(locateVariablesMock).toHaveBeenCalledTimes(2);
		expect(rowsOf(wrapper)).toEqual([
			{
				key: 'Region',
				value: 'changed meanwhile',
			},
		]);
	});

	it('shows the task variables at once while the thread ones are still loading', async () => {
		locateVariablesMock.mockReturnValue(new Promise(() => {}));
		const { wrapper } = mountInfo({
			task: taskWith({
				CustomerID: '458732',
			}),
		});
		await nextTick();

		expect(rowsOf(wrapper)).toHaveLength(1);
		expect(wrapper.find('.loader').exists()).toBe(false);
	});

	it('waits with a loader, not an empty state, until the first answer when nothing is known yet', async () => {
		locateVariablesMock.mockReturnValue(new Promise(() => {}));
		const { wrapper } = mountInfo();
		await nextTick();

		expect(wrapper.find('.loader').exists()).toBe(true);
		expect(wrapper.find('.empty').exists()).toBe(false);
	});

	it('says there are no variables once both sources have answered empty', async () => {
		const { wrapper } = mountInfo();
		await flushPromises();

		expect(wrapper.find('.empty').exists()).toBe(true);
		expect(wrapper.find('.loader').exists()).toBe(false);
	});

	it('keeps the rows on a failed refresh and retries on demand', async () => {
		locateVariablesMock.mockResolvedValueOnce(
			threadVariables({
				Region: 'EU',
			}),
		);
		const { wrapper, isShown } = mountInfo();
		await flushPromises();

		locateVariablesMock.mockRejectedValueOnce(new Error('network down'));
		isShown.value = false;
		await nextTick();
		isShown.value = true;
		await flushPromises();

		expect(wrapper.find('.message').text()).toContain('ui.variables.loadError');
		expect(rowsOf(wrapper)).toHaveLength(1);

		locateVariablesMock.mockResolvedValueOnce(
			threadVariables({
				Region: 'EU',
			}),
		);
		await wrapper.find('.retry').trigger('click');
		await flushPromises();

		expect(wrapper.find('.message').exists()).toBe(false);
	});

	it('forgets the sort when the chat changes', async () => {
		// the task survives the switch, so the table is still there to inspect
		const { wrapper, propsRef } = mountInfo({
			task: taskWith({
				B: '2',
				A: '1',
			}),
		});
		await flushPromises();
		const table = () =>
			wrapper.findComponent({
				name: 'WtTable',
			});
		const keySort = () =>
			(
				table().props('headers') as {
					field: string;
					sort: unknown;
				}[]
			).find((header) => header.field === 'key')?.sort;

		table().vm.$emit(
			'sort',
			{
				field: 'key',
			},
			SortSymbols.ASC,
		);
		await nextTick();
		expect(keySort()).toBe(SortSymbols.ASC);

		propsRef.threadId = 'thread-2';
		await flushPromises();

		expect(keySort()).toBe(SortSymbols.NONE);
	});
});
