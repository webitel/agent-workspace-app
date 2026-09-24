import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import WebitelUI from '@webitel/ui-sdk';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

import { OutboundCallStatus } from '../../../../features/calls/enums/OutboundCallStatus.enum';
import { useNumpadStore } from '../../../numpad/store/numpad';
import { OutboundCallCardState } from '../../enums/OutboundCallCardState.enum';
import TheDialerPanel from '../the-dialer-panel.vue';

/**
 * @author Oleksandr Palonnyi
 * The outbound call store is replaced by its public surface; its behaviour is
 * covered by its own suite, here only what the panel shows and forwards.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
const outboundCallStore = reactive({
	status: null as OutboundCallStatus | null,
	destination: null as string | null,
	preview: null as {
		name?: string;
		number: string;
	} | null,
	placedCall: null as object | null,
	isMuted: false,
	dial: vi.fn(),
	retry: vi.fn(),
	hangup: vi.fn(),
	toggleMute: vi.fn(),
	dismiss: vi.fn(),
});

vi.mock('../../../../features/calls/store/outboundCall', () => ({
	useOutboundCallStore: () => outboundCallStore,
}));

function mountPanel() {
	return mount(TheDialerPanel, {
		global: {
			plugins: [
				createTestingPinia({
					stubActions: false,
				}),
				[
					WebitelUI,
					{
						eventBus,
					},
				],
			],
		},
	});
}

function showOutboundCall(status: OutboundCallStatus) {
	outboundCallStore.status = status;
	outboundCallStore.destination = '0671234567';
	outboundCallStore.preview = {
		number: '0671234567',
	};
}

function findOutboundCard(wrapper: ReturnType<typeof mountPanel>) {
	return wrapper.findComponent({
		name: 'OutboundCallCard',
	});
}

describe('the-dialer-panel', () => {
	beforeEach(() => {
		outboundCallStore.status = null;
		outboundCallStore.destination = null;
		outboundCallStore.preview = null;
		outboundCallStore.placedCall = null;
		for (const action of [
			outboundCallStore.dial,
			outboundCallStore.retry,
			outboundCallStore.hangup,
			outboundCallStore.toggleMute,
			outboundCallStore.dismiss,
		]) {
			action.mockClear();
		}
	});

	it('is hidden while there is nothing to dial or follow', () => {
		const wrapper = mountPanel();

		expect(wrapper.find('.the-dialer-panel').exists()).toBe(false);
	});

	it('shows the numpad once opened', async () => {
		const wrapper = mountPanel();

		useNumpadStore().open();
		await nextTick();

		expect(
			wrapper
				.findComponent({
					name: 'TheNumpad',
				})
				.exists(),
		).toBe(true);
	});

	it('closes the numpad and dials the entered number', async () => {
		const wrapper = mountPanel();
		const numpadStore = useNumpadStore();
		numpadStore.open();
		await nextTick();

		await wrapper.find('input').setValue('123');
		await wrapper.find('input').trigger('keyup.enter');

		expect(numpadStore.close).toHaveBeenCalled();
		expect(outboundCallStore.dial).toHaveBeenCalledWith('123');
	});

	it('starts the numpad with the number it was reopened with', async () => {
		const wrapper = mountPanel();

		useNumpadStore().open('0671234567');
		await nextTick();

		expect((wrapper.find('input').element as HTMLInputElement).value).toBe(
			'0671234567',
		);
	});

	it.each([
		OutboundCallStatus.Dialing,
		OutboundCallStatus.Ringing,
	])('shows the ringing card while %s', async (status) => {
		const wrapper = mountPanel();

		showOutboundCall(status);
		await nextTick();

		expect(findOutboundCard(wrapper).props('state')).toBe(
			OutboundCallCardState.Ringing,
		);
	});

	it('shows the no answer card after an unanswered call', async () => {
		const wrapper = mountPanel();

		showOutboundCall(OutboundCallStatus.NoAnswer);
		await nextTick();

		expect(findOutboundCard(wrapper).props('state')).toBe(
			OutboundCallCardState.NoAnswer,
		);
	});

	it('leaves an answered call to the active call window', async () => {
		const wrapper = mountPanel();

		showOutboundCall(OutboundCallStatus.Answered);
		await nextTick();

		expect(wrapper.find('.the-dialer-panel').exists()).toBe(false);
	});

	it('shows the numpad over the card when the agent opens it', async () => {
		const wrapper = mountPanel();
		showOutboundCall(OutboundCallStatus.Ringing);

		useNumpadStore().open();
		await nextTick();

		expect(findOutboundCard(wrapper).exists()).toBe(false);
	});

	it('goes back to the dialpad with the unanswered number', async () => {
		const wrapper = mountPanel();
		const numpadStore = useNumpadStore();
		showOutboundCall(OutboundCallStatus.NoAnswer);
		await nextTick();

		findOutboundCard(wrapper).vm.$emit('backToDialpad');

		expect(outboundCallStore.dismiss).toHaveBeenCalled();
		expect(numpadStore.open).toHaveBeenCalledWith('0671234567');
	});

	it('forwards retry, hang up and mute to the outbound call', async () => {
		const wrapper = mountPanel();
		showOutboundCall(OutboundCallStatus.Ringing);
		await nextTick();
		const card = findOutboundCard(wrapper);

		card.vm.$emit('retry');
		card.vm.$emit('hangup');
		card.vm.$emit('toggleMute');

		expect(outboundCallStore.retry).toHaveBeenCalled();
		expect(outboundCallStore.hangup).toHaveBeenCalled();
		expect(outboundCallStore.toggleMute).toHaveBeenCalled();
	});
});
