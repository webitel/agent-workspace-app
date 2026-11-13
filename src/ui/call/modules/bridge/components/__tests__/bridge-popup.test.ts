import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

const callsState = reactive({
	activeCalls: [] as Record<string, unknown>[],
});

const bridgeCallsMock = vi.fn();

vi.mock('../../../../../../features/calls/store/calls', () => ({
	useCallsStore: () => ({
		get activeCalls() {
			return callsState.activeCalls;
		},
		getCallById: (callId: string) =>
			callsState.activeCalls.find(({ id }) => id === callId),
		bridgeCalls: (...args: unknown[]) => bridgeCallsMock(...args),
	}),
}));

import { useCallBridgePopupStore } from '../../store/callBridgePopup';
import BridgePopup from '../bridge-popup.vue';

const buildActiveCall = (
	id: string,
	displayName: string,
): Record<string, unknown> => ({
	id,
	displayName,
	displayNumber: `+${id}`,
	answeredAt: 1,
	hangupAt: 0,
});

const stubs = {
	'wt-avatar': true,
	'wt-table': {
		props: [
			'data',
		],
		template: `<ul>
			<li v-for="item in data" :key="item.id" class="row">
				<slot name="name" :item="item" />
				<span class="number">{{ item.number }}</span>
				<slot name="connect" :item="item" />
			</li>
		</ul>`,
	},
	'wt-popup': {
		emits: [
			'close',
		],
		template: `<div class="popup">
			<button class="popup-close" @click="$emit('close')" />
			<slot name="main" />
			<div class="popup-actions"><slot name="actions" /></div>
		</div>`,
	},
	'wt-button': {
		props: [
			'disabled',
		],
		template: '<button :disabled="disabled"><slot /></button>',
	},
};

const mountPopup = () =>
	mount(BridgePopup, {
		global: {
			stubs,
		},
	});

const isDisabled = (button: { attributes: (name: string) => unknown }) =>
	button.attributes('disabled') !== undefined;

describe('bridge-popup', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		bridgeCallsMock.mockReset();
		bridgeCallsMock.mockResolvedValue(true);
		callsState.activeCalls = [
			buildActiveCall('call-1', 'Emily Johnson'),
			buildActiveCall('call-2', 'Daniel Smith'),
			buildActiveCall('call-3', 'Olivia Brown'),
		];
		useCallBridgePopupStore().open('call-1');
	});

	it('lists the other Active calls, not the one it was opened for', () => {
		const wrapper = mountPopup();

		const listed = wrapper.findAll('.row');

		expect(listed).toHaveLength(2);
		expect(wrapper.text()).toContain('Daniel Smith');
		expect(wrapper.text()).toContain('Olivia Brown');
		expect(wrapper.text()).not.toContain('Emily Johnson');
	});

	it('has Cancel as its only action', () => {
		const wrapper = mountPopup();

		expect(wrapper.findAll('.popup-actions button')).toHaveLength(1);
	});

	it('connects the opened call to the call whose Connect was pressed and closes', async () => {
		const wrapper = mountPopup();

		await wrapper.findAll('.row button')[1].trigger('click');
		await flushPromises();

		expect(bridgeCallsMock).toHaveBeenCalledWith('call-1', 'call-3');
		expect(useCallBridgePopupStore().isOpenBridgePopup).toBe(false);
	});

	it('stays open when the calls could not be connected', async () => {
		bridgeCallsMock.mockResolvedValue(false);
		const wrapper = mountPopup();

		await wrapper.findAll('.row button')[0].trigger('click');
		await flushPromises();

		expect(useCallBridgePopupStore().isOpenBridgePopup).toBe(true);
	});

	it('disables every Connect while one is being sent', async () => {
		bridgeCallsMock.mockReturnValue(new Promise(() => {}));
		const wrapper = mountPopup();

		await wrapper.findAll('.row button')[0].trigger('click');

		for (const connectButton of wrapper.findAll('.row button')) {
			expect(isDisabled(connectButton)).toBe(true);
		}
	});

	it('closes without connecting on Cancel', async () => {
		const wrapper = mountPopup();

		await wrapper.findAll('.popup-actions button')[0].trigger('click');

		expect(bridgeCallsMock).not.toHaveBeenCalled();
		expect(useCallBridgePopupStore().isOpenBridgePopup).toBe(false);
	});

	it('closes when the call it was opened for ends', async () => {
		mountPopup();

		callsState.activeCalls = callsState.activeCalls.filter(
			({ id }) => id !== 'call-1',
		);
		await flushPromises();

		expect(useCallBridgePopupStore().isOpenBridgePopup).toBe(false);
	});

	it('drops the row of a call that ends', async () => {
		const wrapper = mountPopup();

		callsState.activeCalls = callsState.activeCalls.filter(
			({ id }) => id !== 'call-2',
		);
		await flushPromises();

		expect(wrapper.findAll('.row')).toHaveLength(1);
		expect(wrapper.text()).not.toContain('Daniel Smith');
	});
});
