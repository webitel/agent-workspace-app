import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import { ChatListTab } from '../../../enums/ChatListTab.enum';

const chatListStore = reactive({
	currentTab: ChatListTab.Active as ChatListTab,
	activeCount: 0,
	snoozedCount: 0,
	unreadCount: 0,
	setTab: vi.fn(),
});
vi.mock('../../../store/chat-list', () => ({
	useChatListStore: () => chatListStore,
}));

import ChatListTabs from '../chat-list-tabs.vue';

// WtTabs is an async component: its import resolves a moment after mounting
const mountTabs = async () => {
	const wrapper = mount(ChatListTabs);
	await vi.waitFor(() => expect(wrapper.find('.wt-tab').exists()).toBe(true));
	return wrapper;
};

const badgeValue = (badge?: {
	attributes: (name: string) => string | undefined;
}) => badge?.attributes('value');

const tabButton = (
	wrapper: Awaited<ReturnType<typeof mountTabs>>,
	label: string,
) => wrapper.findAll('.wt-tab').find((tab) => tab.text().includes(label));

describe('chat-list-tabs', () => {
	beforeEach(() => {
		chatListStore.currentTab = ChatListTab.Active;
		chatListStore.activeCount = 0;
		chatListStore.snoozedCount = 0;
		chatListStore.unreadCount = 0;
		chatListStore.setTab.mockClear();
	});

	it('has an Active and a Snoozed tab', async () => {
		const wrapper = await mountTabs();

		expect(wrapper.findAll('.wt-tab')).toHaveLength(2);
		expect(tabButton(wrapper, 'ui.chatList.tabs.active')).toBeDefined();
		expect(tabButton(wrapper, 'ui.chatList.tabs.snoozed')).toBeDefined();
	});

	it('shows a grey count beside each tab', async () => {
		chatListStore.activeCount = 9;
		chatListStore.snoozedCount = 3;

		const wrapper = await mountTabs();

		const active = tabButton(wrapper, 'ui.chatList.tabs.active')?.find(
			'.wt-badge',
		);
		const snoozed = tabButton(wrapper, 'ui.chatList.tabs.snoozed')?.find(
			'.wt-badge',
		);
		expect(badgeValue(active)).toBe('9');
		expect(active?.classes()).toContain('p-badge--secondary');
		expect(badgeValue(snoozed)).toBe('3');
		expect(snoozed?.classes()).toContain('p-badge--secondary');
	});

	it('shows a zero count rather than none', async () => {
		const wrapper = await mountTabs();

		expect(
			badgeValue(
				tabButton(wrapper, 'ui.chatList.tabs.snoozed')?.find('.wt-badge'),
			),
		).toBe('0');
	});

	it('shows a green unread count on the Active tab', async () => {
		chatListStore.activeCount = 9;
		chatListStore.unreadCount = 2;

		const wrapper = await mountTabs();

		const badges = tabButton(wrapper, 'ui.chatList.tabs.active')?.findAll(
			'.wt-badge',
		);
		expect(badges?.map((badge) => badge.attributes('value'))).toEqual([
			'9',
			'2',
		]);
		expect(badges?.[1].classes()).toContain('p-badge--success');
	});

	it('hides the green count while nothing is unread', async () => {
		chatListStore.activeCount = 9;

		const wrapper = await mountTabs();

		expect(
			tabButton(wrapper, 'ui.chatList.tabs.active')?.findAll('.wt-badge'),
		).toHaveLength(1);
	});

	it('never shows a green count on the Snoozed tab', async () => {
		chatListStore.unreadCount = 2;

		const wrapper = await mountTabs();

		expect(
			tabButton(wrapper, 'ui.chatList.tabs.snoozed')?.findAll('.wt-badge'),
		).toHaveLength(1);
	});

	it('highlights the current tab', async () => {
		chatListStore.currentTab = ChatListTab.Snoozed;

		const wrapper = await mountTabs();

		expect(tabButton(wrapper, 'ui.chatList.tabs.snoozed')?.classes()).toContain(
			'wt-tab--highlight',
		);
		expect(
			tabButton(wrapper, 'ui.chatList.tabs.active')?.classes(),
		).not.toContain('wt-tab--highlight');
	});

	it('switches the tab on click', async () => {
		const wrapper = await mountTabs();

		await tabButton(wrapper, 'ui.chatList.tabs.snoozed')?.trigger('click');

		expect(chatListStore.setTab).toHaveBeenCalledWith(ChatListTab.Snoozed);
	});
});
