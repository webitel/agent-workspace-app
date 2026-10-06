import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

const chatListStore = reactive({
	tasks: [] as {
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
		chatListStore.tasks = [];
		chatListStore.isUnreadFilterAvailable = false;
	});

	it('renders a row for every chat', () => {
		chatListStore.tasks = [
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

	// the unread data is not there yet, and a control with nothing behind it would
	// read as a broken feature
	it('has no toolbar while the unread filter is unavailable', () => {
		const wrapper = mountList();

		expect(wrapper.find('.the-chat-previews-list__toolbar').exists()).toBe(
			false,
		);
		expect(wrapper.find('.chat-unread-filter-stub').exists()).toBe(false);
	});

	it('shows the unread filter once it is available', () => {
		chatListStore.isUnreadFilterAvailable = true;

		const wrapper = mountList();

		expect(wrapper.find('.chat-unread-filter-stub').exists()).toBe(true);
	});
});
