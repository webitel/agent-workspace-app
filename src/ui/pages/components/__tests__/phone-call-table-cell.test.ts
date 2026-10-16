import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// the real store pulls in the socket client and the i18n singleton;
// the cell only needs `call`
const callsStore = {
	call: vi.fn(),
};

vi.mock('../../../../features/calls/store/calls', () => ({
	useCallsStore: () => callsStore,
}));

import PhoneCallTableCell from '../phone-call-table-cell.vue';

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

const mountCell = (phoneNumber?: string) => {
	const wrapper = mount(PhoneCallTableCell, {
		props: {
			phoneNumber,
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

describe('phone-call-table-cell', () => {
	beforeEach(() => {
		callsStore.call.mockReset();
		callsStore.call.mockResolvedValue(true);
	});

	it('shows the passed number', () => {
		const { number } = mountCell('380501112233');

		expect(number()).toBe('380501112233');
	});

	it('disables the call button when there is no number', () => {
		const { button } = mountCell();

		expect(button().attributes('disabled')).toBeDefined();
	});

	it('calls the shown number on click', async () => {
		const { button } = mountCell('380501112233');

		await button().trigger('click');

		expect(callsStore.call).toHaveBeenCalledWith({
			destination: '380501112233',
		});
	});

	it('disables the button while the call is starting', async () => {
		const { button } = mountCell('380501112233');
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
