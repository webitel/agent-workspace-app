import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

const chatListStore = reactive({
	currentTasks: [] as {
		id: number;
	}[],
	isUnreadFilterAvailable: false,
});
vi.mock(
	'../../../../../../features/chats/modules/previews/store/chat-list',
	() => ({
		useChatListStore: () => chatListStore,
	}),
);

vi.mock(
	'../../../../../../features/chats/modules/previews/components/chat-preview/chat-preview.vue',
	() => ({
		default: {
			name: 'ChatPreview',
			template: '<div class="chat-preview-stub" />',
		},
	}),
);
vi.mock(
	'../../../../../../features/chats/modules/previews/components/chat-list-tabs/chat-list-tabs.vue',
	() => ({
		default: {
			name: 'ChatListTabs',
			template: '<div class="chat-list-tabs-stub" />',
		},
	}),
);
vi.mock(
	'../../../../../../features/chats/modules/previews/components/chat-unread-filter/chat-unread-filter.vue',
	() => ({
		default: {
			name: 'ChatUnreadFilter',
			template: '<div class="chat-unread-filter-stub" />',
		},
	}),
);

import TheChatPreviewsList from '../the-chat-previews-list.vue';

const mountList = () =>
	mount(TheChatPreviewsList, {
		global: {
			stubs: {
				WtDivider: true,
			},
		},
	});

describe('the-chat-previews-list', () => {
	beforeEach(() => {
		chatListStore.currentTasks = [];
		chatListStore.isUnreadFilterAvailable = false;
	});

	it('renders a row for every chat', () => {
		chatListStore.currentTasks = [
			{
				id: 1,
			},
			{
				id: 2,
			},
		];

		const wrapper = mountList();

		expect(wrapper.findAll('.chat-preview-stub')).toHaveLength(2);
	});

	it('shows the tabs whatever the unread data', () => {
		const wrapper = mountList();

		expect(wrapper.find('.chat-list-tabs-stub').exists()).toBe(true);
	});

	// the unread data is not there yet, and a control with nothing behind it would
	// read as a broken feature
	it('has no unread filter while it is unavailable', () => {
		const wrapper = mountList();

		expect(wrapper.find('.chat-unread-filter-stub').exists()).toBe(false);
	});

	it('shows the unread filter once it is available', () => {
		chatListStore.isUnreadFilterAvailable = true;

		const wrapper = mountList();

		expect(wrapper.find('.chat-unread-filter-stub').exists()).toBe(true);
	});
});
