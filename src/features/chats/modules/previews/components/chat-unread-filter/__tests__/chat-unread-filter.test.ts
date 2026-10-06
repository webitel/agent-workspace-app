import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

const chatListStore = reactive({
	onlyUnread: false,
	toggleOnlyUnread: vi.fn(),
});
vi.mock('../../../store/chat-list', () => ({
	useChatListStore: () => chatListStore,
}));

import ChatUnreadFilter from '../chat-unread-filter.vue';

const mountFilter = () =>
	mount(ChatUnreadFilter, {
		global: {
			stubs: {
				'wt-icon': {
					props: [
						'icon',
						'color',
					],
					template: '<i :data-icon="icon" :data-color="color" />',
				},
			},
		},
	});

describe('chat-unread-filter', () => {
	beforeEach(() => {
		chatListStore.onlyUnread = false;
		chatListStore.toggleOnlyUnread.mockClear();
	});

	it('reports being off', () => {
		const wrapper = mountFilter();

		expect(wrapper.attributes('aria-pressed')).toBe('false');
		expect(wrapper.find('i').attributes('data-color')).toBe('default');
	});

	it('reports being on', () => {
		chatListStore.onlyUnread = true;

		const wrapper = mountFilter();

		expect(wrapper.attributes('aria-pressed')).toBe('true');
		expect(wrapper.find('i').attributes('data-color')).toBe('active');
	});

	it('toggles the filter on click', async () => {
		const wrapper = mountFilter();

		await wrapper.trigger('click');

		expect(chatListStore.toggleOnlyUnread).toHaveBeenCalledOnce();
	});

	it('is named for what it does', () => {
		const wrapper = mountFilter();

		expect(wrapper.attributes('title')).toBe('ui.chatPreview.onlyUnread');
	});
});
