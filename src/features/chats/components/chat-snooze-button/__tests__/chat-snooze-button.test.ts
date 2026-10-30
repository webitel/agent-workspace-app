import { flushPromises, mount } from '@vue/test-utils';
import { WtButton } from '@webitel/ui-sdk/components';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const snoozeMock = vi.fn();
vi.mock('../../../modules/previews/store/chat-snoozed', () => ({
	useChatSnoozedStore: () => ({
		snooze: (...args: unknown[]) => snoozeMock(...args),
	}),
}));

const emitMock = vi.fn();
vi.mock('@webitel/ui-sdk/scripts', () => ({
	eventBus: {
		$emit: (...args: unknown[]) => emitMock(...args),
	},
}));

vi.mock('vue-i18n', async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	useI18n: () => ({
		t: (key: string) => key,
	}),
}));

import ChatSnoozeButton from '../chat-snooze-button.vue';

const mountButton = () =>
	mount(ChatSnoozeButton, {
		props: {
			threadId: 'chat-1',
		},
	});

describe('chat-snooze-button', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('snoozes its chat on click', async () => {
		snoozeMock.mockResolvedValue(undefined);
		const wrapper = mountButton();

		await wrapper.findComponent(WtButton).vm.$emit('click');
		await flushPromises();

		expect(snoozeMock).toHaveBeenCalledWith('chat-1');
		expect(emitMock).not.toHaveBeenCalled();
	});

	it('tells the agent when the chat could not be snoozed', async () => {
		snoozeMock.mockRejectedValue(new Error('403'));
		const wrapper = mountButton();

		await wrapper.findComponent(WtButton).vm.$emit('click');
		await flushPromises();

		expect(emitMock).toHaveBeenCalledWith('notification', {
			type: 'error',
			text: 'ui.chatList.snooze.error',
		});
	});
});
