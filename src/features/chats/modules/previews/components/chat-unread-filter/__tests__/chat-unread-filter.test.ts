import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

const chatActiveStore = reactive({
	onlyUnread: false,
	toggleOnlyUnread: vi.fn(),
});
vi.mock('../../../store/chat-active', () => ({
	useChatActiveStore: () => chatActiveStore,
}));

import ChatUnreadFilter from '../chat-unread-filter.vue';

const mountFilter = () =>
	mount(ChatUnreadFilter, {
		global: {
			stubs: {
				'wt-icon-btn': {
					props: [
						'icon',
						'color',
					],
					emits: [
						'click',
					],
					template:
						'<button :data-icon="icon" :data-color="color" @click="$emit(\'click\')" />',
				},
			},
		},
	});

describe('chat-unread-filter', () => {
	beforeEach(() => {
		chatActiveStore.onlyUnread = false;
		chatActiveStore.toggleOnlyUnread.mockClear();
	});

	it('reports being off', () => {
		const wrapper = mountFilter();

		expect(wrapper.attributes('aria-pressed')).toBe('false');
		expect(wrapper.attributes('data-icon')).toBe('chat');
		expect(wrapper.attributes('data-color')).toBe('default');
	});

	it('reports being on', () => {
		chatActiveStore.onlyUnread = true;

		const wrapper = mountFilter();

		expect(wrapper.attributes('aria-pressed')).toBe('true');
		expect(wrapper.attributes('data-icon')).toBe('chat--filled');
		expect(wrapper.attributes('data-color')).toBe('active');
	});

	it('toggles the filter on click', async () => {
		const wrapper = mountFilter();

		await wrapper.trigger('click');

		expect(chatActiveStore.toggleOnlyUnread).toHaveBeenCalledOnce();
	});

	it('is named for what it does', () => {
		const wrapper = mountFilter();

		expect(wrapper.attributes('title')).toBe('ui.chatPreview.onlyUnread');
	});
});
