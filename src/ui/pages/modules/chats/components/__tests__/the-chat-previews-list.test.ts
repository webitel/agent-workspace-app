import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

const chatListStore = reactive({
	currentTasks: [] as {
		id: number;
	}[],
	hasMore: false,
	loadMore: vi.fn(),
});
const chatActiveStore = reactive({
	isUnreadFilterAvailable: false,
});
vi.mock(
	'../../../../../../features/chats/modules/previews/store/chat-list',
	() => ({
		useChatListStore: () => chatListStore,
	}),
);

vi.mock(
	'../../../../../../features/chats/modules/previews/store/chat-active',
	() => ({
		useChatActiveStore: () => chatActiveStore,
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
	'../../../../../../features/chats/modules/previews/components/chat-list-search/chat-list-search.vue',
	() => ({
		default: {
			name: 'ChatListSearch',
			template: '<div class="chat-list-search-stub" />',
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
		chatActiveStore.isUnreadFilterAvailable = false;
		chatListStore.hasMore = false;
		chatListStore.loadMore.mockClear();
	});

	it('has the search', () => {
		expect(mountList().find('.chat-list-search-stub').exists()).toBe(true);
	});

	// scrolling to it asks for the next page (AC_02.01.02)
	it('has a scroll sentinel only while there are more chats to show', () => {
		chatListStore.hasMore = true;
		expect(mountList().find('.the-chat-previews-list__sentinel').exists()).toBe(
			true,
		);

		chatListStore.hasMore = false;
		expect(mountList().find('.the-chat-previews-list__sentinel').exists()).toBe(
			false,
		);
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
		chatActiveStore.isUnreadFilterAvailable = true;

		const wrapper = mountList();

		expect(wrapper.find('.chat-unread-filter-stub').exists()).toBe(true);
	});
});
