import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
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

	it('shows a loader, not an empty state, until the first answer when nothing is known yet', async () => {
		locateVariablesMock.mockReturnValue(new Promise(() => {}));
		const { wrapper } = mountInfo();
		await nextTick();

		expect(wrapper.find('.loader').exists()).toBe(true);
		expect(wrapper.find('.empty').exists()).toBe(false);
	});

	it('shows the empty state when neither source has variables', async () => {
		const { wrapper } = mountInfo();
		await flushPromises();

		expect(wrapper.find('.empty').text()).toBe('ui.pages.chats.info.empty');
		expect(wrapper.find('table').exists()).toBe(false);
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

		expect(wrapper.find('.message').text()).toContain(
			'ui.pages.chats.info.loadError',
		);
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

	it('shows the error alone, without an empty state, when the first request fails', async () => {
		locateVariablesMock.mockRejectedValue(new Error('network down'));
		const { wrapper } = mountInfo();
		await flushPromises();

		expect(wrapper.find('.message').exists()).toBe(true);
		expect(wrapper.find('.empty').exists()).toBe(false);
	});

	describe('sorting', () => {
		const tableOf = (wrapper: ReturnType<typeof mountInfo>['wrapper']) =>
			wrapper.findComponent({
				name: 'WtTable',
			});

		async function mountWithRows() {
			locateVariablesMock.mockResolvedValue(
				threadVariables({
					B: '2',
					A: '1',
				}),
			);
			const mounted = mountInfo();
			await flushPromises();
			return mounted;
		}

		const headerSort = (
			wrapper: ReturnType<typeof mountInfo>['wrapper'],
			field: string,
		) =>
			(
				tableOf(wrapper).props('headers') as {
					field: string;
					sort: unknown;
				}[]
			).find((header) => header.field === field)?.sort;

		it('turns table sorting on and starts unsorted, in source order', async () => {
			const { wrapper } = await mountWithRows();

			expect(tableOf(wrapper).props('sortable')).toBe(true);
			expect(headerSort(wrapper, 'key')).toBeNull();
			expect(rowsOf(wrapper).map((row) => row.key)).toEqual([
				'B',
				'A',
			]);
		});

		it('sorts by the column the table reports, and reflects it in that header', async () => {
			const { wrapper } = await mountWithRows();

			tableOf(wrapper).vm.$emit(
				'sort',
				{
					field: 'key',
				},
				'asc',
			);
			await nextTick();

			expect(rowsOf(wrapper).map((row) => row.key)).toEqual([
				'A',
				'B',
			]);
			expect(headerSort(wrapper, 'key')).toBe('asc');
			expect(headerSort(wrapper, 'value')).toBeNull();
		});

		it('returns to source order when the table reports no sort', async () => {
			const { wrapper } = await mountWithRows();
			tableOf(wrapper).vm.$emit(
				'sort',
				{
					field: 'key',
				},
				'asc',
			);
			await nextTick();

			tableOf(wrapper).vm.$emit(
				'sort',
				{
					field: 'key',
				},
				null,
			);
			await nextTick();

			expect(rowsOf(wrapper).map((row) => row.key)).toEqual([
				'B',
				'A',
			]);
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
			tableOf(wrapper).vm.$emit(
				'sort',
				{
					field: 'key',
				},
				'asc',
			);
			await nextTick();

			propsRef.threadId = 'thread-2';
			await flushPromises();

			expect(headerSort(wrapper, 'key')).toBeNull();
		});
	});
});
