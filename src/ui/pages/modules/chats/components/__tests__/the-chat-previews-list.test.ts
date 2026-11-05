import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

const loadNextMock = vi.fn();
const chatListStore = reactive({
	currentTasks: [] as {
		id: number;
	}[],
	hasNext: false,
	isLoading: false,
	loadError: null as unknown,
	loadNext: loadNextMock,
});

// the test drives what the observer would report for the end of the list
let reportIntersection: (isIntersecting: boolean) => void = () => {};
vi.mock('@vueuse/core', () => ({
	useIntersectionObserver: (
		_target: unknown,
		callback: (
			entries: {
				isIntersecting: boolean;
			}[],
		) => void,
	) => {
		reportIntersection = (isIntersecting) =>
			callback([
				{
					isIntersecting,
				},
			]);
	},
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
				WtLoader: {
					template: '<div class="wt-loader-stub" />',
				},
			},
		},
	});

// the store is shared, so a list left mounted would keep reacting to it
enableAutoUnmount(afterEach);

describe('the-chat-previews-list', () => {
	beforeEach(() => {
		chatListStore.currentTasks = [];
		chatListStore.hasNext = false;
		chatListStore.isLoading = false;
		chatListStore.loadError = null;
		chatActiveStore.isUnreadFilterAvailable = false;
		loadNextMock.mockReset();
		emitMock.mockReset();
		reportIntersection = () => {};
	});

	it('has the search', () => {
		expect(mountList().find('.chat-list-search-stub').exists()).toBe(true);
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

	// until the unread chats have been read, a control with nothing behind it
	// would read as a broken feature
	it('has no unread filter while it is unavailable', () => {
		const wrapper = mountList();

		expect(wrapper.find('.chat-unread-filter-stub').exists()).toBe(false);
	});

	it('shows the unread filter once it is available', () => {
		chatActiveStore.isUnreadFilterAvailable = true;

		const wrapper = mountList();

		expect(wrapper.find('.chat-unread-filter-stub').exists()).toBe(true);
	});

	// AC_02.01.02, AC_02.02.02
	describe('loading on scroll', () => {
		it('has no end marker once the last page has been read', () => {
			const wrapper = mountList();

			expect(wrapper.find('.the-chat-previews-list__sentinel').exists()).toBe(
				false,
			);
		});

		it('reads the next page as the end of the list comes into view', async () => {
			chatListStore.hasNext = true;
			mountList();

			reportIntersection(true);
			await flushPromises();

			expect(loadNextMock).toHaveBeenCalledOnce();
		});

		it('shows a loader while a page is read', () => {
			chatListStore.hasNext = true;
			chatListStore.isLoading = true;

			const wrapper = mountList();

			expect(wrapper.find('.wt-loader-stub').exists()).toBe(true);
		});

		// a page shorter than the panel leaves the end in view
		it('reads on while the end of the list stays in view', async () => {
			chatListStore.hasNext = true;
			chatListStore.isLoading = true;
			mountList();
			reportIntersection(true);
			await flushPromises();
			loadNextMock.mockClear();

			chatListStore.isLoading = false;
			await flushPromises();

			expect(loadNextMock).toHaveBeenCalledOnce();
		});

		it('does not read on by itself after a failed page', async () => {
			chatListStore.hasNext = true;
			chatListStore.isLoading = true;
			mountList();
			reportIntersection(true);
			await flushPromises();
			loadNextMock.mockClear();

			chatListStore.loadError = new Error('boom');
			chatListStore.isLoading = false;
			await flushPromises();

			expect(loadNextMock).not.toHaveBeenCalled();
			expect(emitMock).toHaveBeenCalledWith('notification', {
				type: 'error',
				text: 'ui.chatList.loadError',
			});
		});
	});
});
