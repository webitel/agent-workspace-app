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

vi.mock('../../../../../../features/calls/store/calls', () => ({
	useCallsStore: () => ({
		getCallById: () => callState.call,
		blindTransfer: (...args: unknown[]) => blindTransferMock(...args),
	}),
}));

import { useCallTransferPopupStore } from '../../store/callTransferPopup';
import CallTransferPopup from '../call-transfer-popup.vue';

const stubs = {
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
		],
		template:
			'<input class="search" :value="value" @input="$emit(\'input\', $event.target.value)" />',
	},
};

const mountPopup = () =>
	mount(CallTransferPopup, {
		global: {
			stubs,
		},
	});

type Wrapper = ReturnType<typeof mountPopup>;

const topButtons = (wrapper: Wrapper) =>
	wrapper.findAll('.call-transfer-popup__phone button');

const bottomButtons = (wrapper: Wrapper) =>
	wrapper.findAll('.popup-actions button');

const isDisabled = (button: { attributes: (name: string) => unknown }) =>
	button.attributes('disabled') !== undefined;

describe('call-transfer-popup', () => {
	beforeEach(() => {
		blindTransferMock.mockReset();
		blindTransferMock.mockResolvedValue(true);
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
