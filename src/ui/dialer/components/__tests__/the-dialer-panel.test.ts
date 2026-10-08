import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import WebitelUI from '@webitel/ui-sdk';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

import { OutboundCallStatus } from '../../../../features/calls/enums/OutboundCallStatus.enum';
import type { OutboundCallAttemptView } from '../../../../features/calls/types/OutboundCallAttempt.types';
import { useNumpadStore } from '../../../numpad/store/numpad';
import { OutboundCallCardState } from '../../enums/OutboundCallCardState.enum';
import TheDialerPanel from '../the-dialer-panel.vue';

/**
 * @author Oleksandr Palonnyi
 * The outbound call attempts store is replaced by its public surface: its behaviour is
 * covered by its own suite, here only what the panel shows and forwards
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
const outboundCallAttemptsStore = reactive({
	attempts: [] as OutboundCallAttemptView[],
	start: vi.fn(),
	retry: vi.fn(),
	hangup: vi.fn(),
	toggleMute: vi.fn(),
	clearAttempt: vi.fn(),
});

vi.mock('../../../../features/calls/store/outboundCallAttempts', () => ({
	useOutboundCallAttemptsStore: () => outboundCallAttemptsStore,
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

function buildAttempt(
	id: string,
	status: OutboundCallStatus,
	overrides: Partial<OutboundCallAttemptView> = {},
): OutboundCallAttemptView {
	return {
		id,
		destination: '0671234567',
		placedCall: null,
		status,
		preview: {
			number: '0671234567',
		},
		isMuted: false,
		...overrides,
	};
}

function showOutboundCalls(...attempts: OutboundCallAttemptView[]) {
	outboundCallAttemptsStore.attempts = attempts;
}

function findOutboundCards(wrapper: ReturnType<typeof mountPanel>) {
	return wrapper.findAllComponents({
		name: 'OutboundCallCard',
	});
}

async function placeCallFromNumpad(
	wrapper: ReturnType<typeof mountPanel>,
	destination: string,
) {
	useNumpadStore().open();
	await nextTick();

	await wrapper.find('input').setValue(destination);
	await wrapper
		.findAll('button')
		.find((button) => button.text() === 'ui.numpad.call')
		?.trigger('click');
}

describe('the-dialer-panel', () => {
	beforeEach(() => {
		outboundCallAttemptsStore.attempts = [];
		for (const action of [
			outboundCallAttemptsStore.start,
			outboundCallAttemptsStore.retry,
			outboundCallAttemptsStore.hangup,
			outboundCallAttemptsStore.toggleMute,
			outboundCallAttemptsStore.clearAttempt,
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

	it('prefills the number the numpad store was opened with', async () => {
		const wrapper = mountPanel();

		useNumpadStore().open('0671234567');
		await nextTick();

		expect(wrapper.find('input').element.value).toBe('0671234567');
	});

	it('dials the entered number when a call is placed', async () => {
		const wrapper = mountPanel();

		await placeCallFromNumpad(wrapper, '0671234567');

		expect(outboundCallAttemptsStore.start).toHaveBeenCalledWith('0671234567');
	});

	it('closes the numpad once a call is placed', async () => {
		const wrapper = mountPanel();

		await placeCallFromNumpad(wrapper, '123');

		expect(useNumpadStore().close).toHaveBeenCalled();
	});

	it.each([
		OutboundCallStatus.Dialing,
		OutboundCallStatus.Ringing,
	])('shows the ringing card while %s', async (status) => {
		const wrapper = mountPanel();

		showOutboundCalls(buildAttempt('a1', status));
		await nextTick();

		expect(findOutboundCards(wrapper)[0].props('state')).toBe(
			OutboundCallCardState.Ringing,
		);
	});

	it('shows the no answer card after an unanswered call', async () => {
		const wrapper = mountPanel();

		showOutboundCalls(buildAttempt('a1', OutboundCallStatus.NoAnswer));
		await nextTick();

		expect(findOutboundCards(wrapper)[0].props('state')).toBe(
			OutboundCallCardState.NoAnswer,
		);
	});

	it('leaves an answered call to the active call window', async () => {
		const wrapper = mountPanel();

		showOutboundCalls(buildAttempt('a1', OutboundCallStatus.Answered));
		await nextTick();

		expect(wrapper.find('.the-dialer-panel').exists()).toBe(false);
	});

	it('shows one card per attempt', async () => {
		const wrapper = mountPanel();

		showOutboundCalls(
			buildAttempt('a1', OutboundCallStatus.Ringing),
			buildAttempt('a2', OutboundCallStatus.NoAnswer),
		);
		await nextTick();

		expect(findOutboundCards(wrapper)).toHaveLength(2);
	});

	it('keeps the numpad open beside the cards', async () => {
		const wrapper = mountPanel();
		showOutboundCalls(buildAttempt('a1', OutboundCallStatus.Ringing));

		useNumpadStore().open();
		await nextTick();

		expect(
			wrapper
				.findComponent({
					name: 'TheNumpad',
				})
				.exists(),
		).toBe(true);
		expect(findOutboundCards(wrapper)).toHaveLength(1);
	});

	it('allows mute only once the call exists', async () => {
		const wrapper = mountPanel();
		showOutboundCalls(buildAttempt('a1', OutboundCallStatus.Dialing));
		await nextTick();

		expect(findOutboundCards(wrapper)[0].props('canToggleMute')).toBe(false);

		showOutboundCalls(
			buildAttempt('a1', OutboundCallStatus.Ringing, {
				placedCall: {} as OutboundCallAttemptView['placedCall'],
			}),
		);
		await nextTick();

		expect(findOutboundCards(wrapper)[0].props('canToggleMute')).toBe(true);
	});

	it('goes back to the dialpad with the unanswered number', async () => {
		const wrapper = mountPanel();
		const numpadStore = useNumpadStore();
		showOutboundCalls(buildAttempt('a1', OutboundCallStatus.NoAnswer));
		await nextTick();

		findOutboundCards(wrapper)[0].vm.$emit('backToDialpad');

		expect(outboundCallAttemptsStore.clearAttempt).toHaveBeenCalledWith('a1');
		expect(numpadStore.open).toHaveBeenCalledWith('0671234567');
	});

	it('forwards retry, hang up and mute with the id of their own attempt', async () => {
		const wrapper = mountPanel();
		showOutboundCalls(
			buildAttempt('a1', OutboundCallStatus.Ringing),
			buildAttempt('a2', OutboundCallStatus.Ringing),
		);
		await nextTick();
		const secondCard = findOutboundCards(wrapper)[1];

		secondCard.vm.$emit('retry');
		secondCard.vm.$emit('hangup');
		secondCard.vm.$emit('toggleMute');

		expect(outboundCallAttemptsStore.retry).toHaveBeenCalledWith('a2');
		expect(outboundCallAttemptsStore.hangup).toHaveBeenCalledWith('a2');
		expect(outboundCallAttemptsStore.toggleMute).toHaveBeenCalledWith('a2');
	});
});
