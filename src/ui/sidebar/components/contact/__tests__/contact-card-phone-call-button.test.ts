import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// the real store pulls in the socket client and the i18n singleton;
// the button only needs `start`
const outboundCallAttemptsStore = {
	start: vi.fn(),
};

vi.mock('../../../../../features/calls/store/outboundCallAttempts', () => ({
	useOutboundCallAttemptsStore: () => outboundCallAttemptsStore,
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtButton: {
		name: 'WtButton',
		props: [
			'disabled',
		],
		emits: [
			'click',
		],
		template:
			'<button class="call-button" :disabled="disabled" @click="$emit(\'click\')" />',
	},
}));

import ContactCardPhoneCallButton from '../contact-card-phone-call-button.vue';

const mountButton = (number = '380991358573') =>
	mount(ContactCardPhoneCallButton, {
		props: {
			number,
		},
	}).find('.call-button');

describe('ContactCardPhoneCallButton', () => {
	beforeEach(() => {
		outboundCallAttemptsStore.start.mockReset();
		outboundCallAttemptsStore.start.mockResolvedValue(undefined);
	});

	it('calls the passed number on click', async () => {
		const button = mountButton('380991358573');

		await button.trigger('click');

		expect(outboundCallAttemptsStore.start).toHaveBeenCalledWith(
			'380991358573',
		);
	});

	it('is disabled while the call is starting', async () => {
		const button = mountButton();
		let finishCall: () => void = () => {};
		outboundCallAttemptsStore.start.mockReturnValue(
			new Promise<void>((resolve) => {
				finishCall = resolve;
			}),
		);

		expect(button.attributes('disabled')).toBeUndefined();

		await button.trigger('click');
		expect(button.attributes('disabled')).toBeDefined();

		finishCall();
		await flushPromises();
		expect(button.attributes('disabled')).toBeUndefined();
	});
});
