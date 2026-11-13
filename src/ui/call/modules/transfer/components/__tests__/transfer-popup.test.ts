import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

const callState = reactive({
	call: {
		id: 'call-1',
		answeredAt: 1,
		hangupAt: 0,
	} as Record<string, unknown> | undefined,
});

const blindTransferMock = vi.fn();
const consultTransferToAgentMock = vi.fn();
const blindTransferToQueueMock = vi.fn();
const consultTransferToQueueMock = vi.fn();

vi.mock('../../../../../../features/calls/store/calls', () => ({
	useCallsStore: () => ({
		getCallById: () => callState.call,
		blindTransfer: (...args: unknown[]) => blindTransferMock(...args),
		consultTransferToAgent: (...args: unknown[]) =>
			consultTransferToAgentMock(...args),
		blindTransferToQueue: (...args: unknown[]) =>
			blindTransferToQueueMock(...args),
		consultTransferToQueue: (...args: unknown[]) =>
			consultTransferToQueueMock(...args),
	}),
}));

import { useCallTransferPopupStore } from '../../store/callTransferPopup';
import TransferAgentsTable from '../transfer-agents-table.vue';
import TransferPopup from '../transfer-popup.vue';
import TransferQueuesTable from '../transfer-queues-table.vue';

const stubs = {
	TransferAgentsTable: true,
	TransferQueuesTable: true,
	'wt-popup': {
		emits: [
			'close',
		],
		template: `<div class="popup">
			<button class="popup-close" @click="$emit('close')" />
			<slot name="title" />
			<slot name="main" />
			<div class="popup-actions"><slot name="actions" /></div>
		</div>`,
	},
	'wt-input-text': {
		props: [
			'modelValue',
			'disabled',
		],
		emits: [
			'update:modelValue',
		],
		template:
			'<input class="phone" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
	},
	'wt-button': {
		props: [
			'disabled',
		],
		template: '<button :disabled="disabled"><slot /></button>',
	},
	'wt-tabs': {
		props: [
			'tabs',
		],
		emits: [
			'change',
		],
		template: `<nav>
			<button
				v-for="tab in tabs"
				:key="tab.value"
				class="tab"
				:data-tab="tab.value"
				@click="$emit('change', tab)"
			>{{ tab.text }}</button>
		</nav>`,
	},
	'wt-search-bar': {
		props: [
			'value',
		],
		emits: [
			'input',
			'search',
		],
		template:
			'<input class="search" :value="value" @input="$emit(\'input\', $event.target.value)" @change="$emit(\'search\', $event.target.value)" />',
	},
};

const mountPopup = () =>
	mount(TransferPopup, {
		global: {
			stubs,
		},
	});

type Wrapper = ReturnType<typeof mountPopup>;

const topButtons = (wrapper: Wrapper) =>
	wrapper.findAll('.transfer-popup__phone button');

const bottomButtons = (wrapper: Wrapper) =>
	wrapper.findAll('.popup-actions button');

const isDisabled = (button: { attributes: (name: string) => unknown }) =>
	button.attributes('disabled') !== undefined;

describe('transfer-popup', () => {
	beforeEach(() => {
		blindTransferMock.mockReset();
		blindTransferMock.mockResolvedValue(true);
		consultTransferToAgentMock.mockReset();
		consultTransferToAgentMock.mockResolvedValue(true);
		blindTransferToQueueMock.mockReset();
		blindTransferToQueueMock.mockResolvedValue(true);
		consultTransferToQueueMock.mockReset();
		consultTransferToQueueMock.mockResolvedValue(true);
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		callState.call = {
			id: 'call-1',
			answeredAt: 1,
			hangupAt: 0,
		};
		useCallTransferPopupStore().open('call-1');
	});

	it('titles itself and offers the four destination tabs, Agents first (AC_13.07.01)', () => {
		const wrapper = mountPopup();

		expect(wrapper.text()).toContain('ui.call.transfer.title');
		expect(
			wrapper.findAll('.tab').map((tab) => tab.attributes('data-tab')),
		).toEqual([
			'agents',
			'queues',
			'users',
			'dialplans',
		]);
	});

	it('starts with every BLIND and CONSULT button disabled', () => {
		const wrapper = mountPopup();

		expect(topButtons(wrapper)).toHaveLength(2);
		expect(topButtons(wrapper).every(isDisabled)).toBe(true);
		expect(bottomButtons(wrapper).slice(0, 2).every(isDisabled)).toBe(true);
	});

	it('enables the buttons beside the field once a number is typed, not the bottom ones (AC_13.07.02, .12)', async () => {
		const wrapper = mountPopup();

		await wrapper.find('.phone').setValue('1001');

		expect(topButtons(wrapper).every(isDisabled)).toBe(false);
		expect(bottomButtons(wrapper).slice(0, 2).every(isDisabled)).toBe(true);
	});

	it('blind-transfers the call to the typed number, sanitized like a dialled one', async () => {
		const wrapper = mountPopup();
		await wrapper.find('.phone').setValue(' +380 (67) 123-45-67 ');

		await topButtons(wrapper)[0].trigger('click');

		expect(blindTransferMock).toHaveBeenCalledWith('call-1', '+380671234567');
		expect(wrapper.emitted('transfer')).toBeUndefined();
	});

	it('locks the buttons and the field while the transfer is in flight', async () => {
		let finishTransfer: (isTransferred: boolean) => void = () => {};
		blindTransferMock.mockReturnValue(
			new Promise<boolean>((resolve) => {
				finishTransfer = resolve;
			}),
		);
		const wrapper = mountPopup();
		await wrapper.find('.phone').setValue('1001');

		await topButtons(wrapper)[0].trigger('click');

		expect(topButtons(wrapper).every(isDisabled)).toBe(true);
		expect(isDisabled(wrapper.find('.phone'))).toBe(true);

		finishTransfer(false);
		await flushPromises();

		expect(topButtons(wrapper).every(isDisabled)).toBe(false);
		expect(isDisabled(wrapper.find('.phone'))).toBe(false);
	});

	it('stays open with the typed number when the transfer fails', async () => {
		blindTransferMock.mockResolvedValue(false);
		const wrapper = mountPopup();
		await wrapper.find('.phone').setValue('1001');

		await topButtons(wrapper)[0].trigger('click');
		await flushPromises();

		expect(useCallTransferPopupStore().isOpenTransferPopup).toBe(true);
		expect((wrapper.find('.phone').element as HTMLInputElement).value).toBe(
			'1001',
		);
	});

	it('only requests a consult transfer to the typed number, it is not executed yet', async () => {
		const wrapper = mountPopup();
		await wrapper.find('.phone').setValue('1001');

		await topButtons(wrapper)[1].trigger('click');

		expect(wrapper.emitted('transfer')?.[0][0]).toMatchObject({
			mode: 'consult',
		});
		expect(blindTransferMock).not.toHaveBeenCalled();
		expect(consultTransferToAgentMock).not.toHaveBeenCalled();
	});

	describe('consult to a selected agent', () => {
		const selectAgent = async (wrapper: Wrapper, agentId: string) => {
			wrapper
				.findComponent(TransferAgentsTable)
				.vm.$emit('update:selectedRowId', agentId);
			await flushPromises();
		};

		it('consults the agent of the selected row and closes the popup', async () => {
			const wrapper = mountPopup();
			await selectAgent(wrapper, '42');

			await bottomButtons(wrapper)[1].trigger('click');
			await flushPromises();

			expect(consultTransferToAgentMock).toHaveBeenCalledWith('call-1', '42');
			expect(wrapper.emitted('transfer')).toBeUndefined();
			expect(useCallTransferPopupStore().isOpenTransferPopup).toBe(false);
		});

		it('stays open with the selection when the consult is refused', async () => {
			consultTransferToAgentMock.mockResolvedValue(false);
			const wrapper = mountPopup();
			await selectAgent(wrapper, '42');

			await bottomButtons(wrapper)[1].trigger('click');
			await flushPromises();

			expect(useCallTransferPopupStore().isOpenTransferPopup).toBe(true);
			expect(isDisabled(bottomButtons(wrapper)[1])).toBe(false);
		});

		it('locks the buttons while the consult is in flight', async () => {
			let finishConsult: (isPlaced: boolean) => void = () => {};
			consultTransferToAgentMock.mockReturnValue(
				new Promise<boolean>((resolve) => {
					finishConsult = resolve;
				}),
			);
			const wrapper = mountPopup();
			await selectAgent(wrapper, '42');

			await bottomButtons(wrapper)[1].trigger('click');

			expect(isDisabled(bottomButtons(wrapper)[1])).toBe(true);

			finishConsult(false);
			await flushPromises();

			expect(isDisabled(bottomButtons(wrapper)[1])).toBe(false);
		});
	});

	describe('transfer to a selected queue', () => {
		const selectQueue = async (wrapper: Wrapper, queueId: string) => {
			await wrapper.find('[data-tab="queues"]').trigger('click');
			wrapper
				.findComponent(TransferQueuesTable)
				.vm.$emit('update:selectedRowId', queueId);
			await flushPromises();
		};

		it('blind-transfers to the queue of the selected row and leaves the popup open', async () => {
			const wrapper = mountPopup();
			await selectQueue(wrapper, '7');

			await bottomButtons(wrapper)[0].trigger('click');
			await flushPromises();

			expect(blindTransferToQueueMock).toHaveBeenCalledWith('call-1', '7');
			expect(wrapper.emitted('transfer')).toBeUndefined();
			expect(useCallTransferPopupStore().isOpenTransferPopup).toBe(true);
		});

		it('consults the queue of the selected row and closes the popup', async () => {
			const wrapper = mountPopup();
			await selectQueue(wrapper, '7');

			await bottomButtons(wrapper)[1].trigger('click');
			await flushPromises();

			expect(consultTransferToQueueMock).toHaveBeenCalledWith('call-1', '7');
			expect(consultTransferToAgentMock).not.toHaveBeenCalled();
			expect(wrapper.emitted('transfer')).toBeUndefined();
			expect(useCallTransferPopupStore().isOpenTransferPopup).toBe(false);
		});

		it('stays open with the selection when the consult is refused', async () => {
			consultTransferToQueueMock.mockResolvedValue(false);
			const wrapper = mountPopup();
			await selectQueue(wrapper, '7');

			await bottomButtons(wrapper)[1].trigger('click');
			await flushPromises();

			expect(useCallTransferPopupStore().isOpenTransferPopup).toBe(true);
			expect(isDisabled(bottomButtons(wrapper)[1])).toBe(false);
		});

		it('locks the buttons while the transfer is in flight', async () => {
			let finishTransfer: (isTransferred: boolean) => void = () => {};
			blindTransferToQueueMock.mockReturnValue(
				new Promise<boolean>((resolve) => {
					finishTransfer = resolve;
				}),
			);
			const wrapper = mountPopup();
			await selectQueue(wrapper, '7');

			await bottomButtons(wrapper)[0].trigger('click');

			expect(isDisabled(bottomButtons(wrapper)[0])).toBe(true);

			finishTransfer(false);
			await flushPromises();

			expect(isDisabled(bottomButtons(wrapper)[0])).toBe(false);
		});
	});

	it('keeps the typed number and clears the search when the tab changes', async () => {
		const wrapper = mountPopup();
		await wrapper.find('.phone').setValue('1001');
		await wrapper.find('.search').setValue('mon');

		await wrapper.find('[data-tab="queues"]').trigger('click');

		expect((wrapper.find('.phone').element as HTMLInputElement).value).toBe(
			'1001',
		);
		expect((wrapper.find('.search').element as HTMLInputElement).value).toBe(
			'',
		);
	});

	it('clears the selected row when the search changes', async () => {
		const wrapper = mountPopup();
		await wrapper.find('[data-tab="queues"]').trigger('click');
		wrapper
			.findComponent(TransferQueuesTable)
			.vm.$emit('update:selectedRowId', '7');
		await flushPromises();
		expect(isDisabled(bottomButtons(wrapper)[0])).toBe(false);

		await wrapper.find('.search').setValue('mon');
		await flushPromises();

		expect(isDisabled(bottomButtons(wrapper)[0])).toBe(true);
	});

	it('closes from the cancel button and the close icon', async () => {
		const store = useCallTransferPopupStore();
		const wrapper = mountPopup();

		await bottomButtons(wrapper)[2].trigger('click');
		expect(store.isOpenTransferPopup).toBe(false);

		store.open('call-1');
		await wrapper.find('.popup-close').trigger('click');
		expect(store.isOpenTransferPopup).toBe(false);
	});

	it('closes when the call being transferred ends', async () => {
		const store = useCallTransferPopupStore();
		mountPopup();

		callState.call = {
			id: 'call-1',
			answeredAt: 1,
			hangupAt: 2,
		};
		await flushPromises();

		expect(store.isOpenTransferPopup).toBe(false);
	});

	it('closes when the call being transferred is gone', async () => {
		const store = useCallTransferPopupStore();
		mountPopup();

		callState.call = undefined;
		await flushPromises();

		expect(store.isOpenTransferPopup).toBe(false);
	});
});
