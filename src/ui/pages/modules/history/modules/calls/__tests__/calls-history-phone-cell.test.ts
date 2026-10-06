import { flushPromises, mount } from '@vue/test-utils';
import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CallDirection } from 'webitel-sdk';

// the real store pulls in the socket client and the i18n singleton;
// the cell only needs `call`
const callsStore = {
	call: vi.fn(),
};

vi.mock('../../../../../../../features/calls/store/calls', () => ({
	useCallsStore: () => callsStore,
}));

import CallsHistoryPhoneCell from '../calls-history-phone-cell.vue';

const stubs = {
	'wt-button': {
		props: [
			'disabled',
		],
		emits: [
			'click',
		],
		template:
			'<button class="call-button" :disabled="disabled" @click="$emit(\'click\')" />',
	},
};

const mountCell = (item: EngineHistoryCall) => {
	const wrapper = mount(CallsHistoryPhoneCell, {
		props: {
			item,
		},
		global: {
			stubs,
		},
	});

	return {
		button: () => wrapper.find('.call-button'),
		number: () => wrapper.find('p').text(),
	};
};

describe('calls-history-phone-cell', () => {
	beforeEach(() => {
		callsStore.call.mockReset();
		callsStore.call.mockResolvedValue(true);
	});

	it('shows the callee number for an outbound call', () => {
		const { number } = mountCell({
			direction: CallDirection.Outbound,
			to: {
				number: '380501112233',
			},
			from: {
				number: '100',
			},
		});

		expect(number()).toBe('380501112233');
	});

	it('falls back to the dialed destination for an outbound call', () => {
		const { number } = mountCell({
			direction: CallDirection.Outbound,
			destination: '0501112233',
		});

		expect(number()).toBe('0501112233');
	});

	it('shows the caller number for an inbound call', () => {
		const { number } = mountCell({
			direction: CallDirection.Inbound,
			from: {
				number: '380501112233',
			},
			to: {
				number: '100',
			},
		});

		expect(number()).toBe('380501112233');
	});

	it('disables the call button when there is no number', () => {
		const { button } = mountCell({
			direction: CallDirection.Inbound,
		});

		expect(button().attributes('disabled')).toBeDefined();
	});

	it('calls the shown number on click', async () => {
		const { button } = mountCell({
			direction: CallDirection.Inbound,
			from: {
				number: '380501112233',
			},
		});

		await button().trigger('click');

		expect(callsStore.call).toHaveBeenCalledWith({
			destination: '380501112233',
		});
	});

	it('disables the button while the call is starting', async () => {
		const { button } = mountCell({
			direction: CallDirection.Inbound,
			from: {
				number: '380501112233',
			},
		});
		let finishCall: (result: boolean) => void = () => {};
		callsStore.call.mockReturnValue(
			new Promise((resolve) => {
				finishCall = resolve;
			}),
		);

		await button().trigger('click');
		expect(button().attributes('disabled')).toBeDefined();

		finishCall(false);
		await flushPromises();
		expect(button().attributes('disabled')).toBeUndefined();
	});
});
