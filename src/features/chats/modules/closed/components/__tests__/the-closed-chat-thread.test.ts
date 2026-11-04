import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { useChatAccountStore } from '../../../../store/chat-account';
import { useClosedChatStore } from '../../store/closed-chat';
import TheClosedChatThread from '../the-closed-chat-thread.vue';

vi.mock('vue-router', () => ({
	useRoute: () => ({
		params: {
			threadId: 'chat-1',
		},
	}),
}));

// Mock the ui-chats /v2 entry: importing the real ChatThread pulls the
// styleguide/ui-sdk asset tree (svg?raw) that vitest refuses to transform.
vi.mock('@webitel/ui-chats/v2', () => ({
	ChatThreadMode: {
		Awaiting: 'awaiting',
		Active: 'active',
		Readonly: 'readonly',
	},
	ChatThread: {
		name: 'ChatThread',
		props: [
			'thread',
			'messages',
			'selfMemberId',
			'mode',
			'hasMore',
			'actions',
			'onLoadMore',
			'onSend',
			'onAttach',
			'onSeen',
		],
		template: '<div class="chat-thread-stub" />',
	},
}));

const mountThread = () =>
	mount(TheClosedChatThread, {
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
		},
	});

const chatThread = (wrapper: ReturnType<typeof mountThread>) =>
	wrapper.findComponent({
		name: 'ChatThread',
	});

const withThread = async (wrapper: ReturnType<typeof mountThread>) => {
	const store = useClosedChatStore('chat-1');
	store.thread = {
		id: 'chat-1',
		members: [
			{
				id: 'member-self',
				contact: {
					iss: 'iss',
					sub: 'agent',
				},
			},
		],
	} as never;
	await wrapper.vm.$nextTick();
	return store;
};

describe('the-closed-chat-thread', () => {
	it('renders nothing until the closed chat has loaded', () => {
		const wrapper = mountThread();

		expect(chatThread(wrapper).exists()).toBe(false);
	});

	it('shows the closed chat read-only, with its history and paging', async () => {
		const wrapper = mountThread();
		const store = await withThread(wrapper);
		store.messages = [
			{
				id: 'm1',
			},
		] as never;
		// testing pinia lets a getter be set, though its type says read-only
		(
			store as unknown as {
				hasMore: boolean;
			}
		).hasMore = true;
		await wrapper.vm.$nextTick();

		expect(chatThread(wrapper).props('mode')).toBe('readonly');
		expect(chatThread(wrapper).props('thread')).toMatchObject({
			id: 'chat-1',
		});
		expect(chatThread(wrapper).props('messages')).toEqual([
			expect.objectContaining({
				id: 'm1',
			}),
		]);
		expect(chatThread(wrapper).props('hasMore')).toBe(true);
		expect(chatThread(wrapper).props('onLoadMore')).toBe(store.loadMore);
	});

	// the agent has left: nothing to send, attach or mark read
	it('offers no way to write to the chat', async () => {
		const wrapper = mountThread();
		await withThread(wrapper);

		expect(chatThread(wrapper).props('onSend')).toBeUndefined();
		expect(chatThread(wrapper).props('onAttach')).toBeUndefined();
		expect(chatThread(wrapper).props('onSeen')).toBeUndefined();
	});

	it("tells the agent's own messages from the client's", async () => {
		const wrapper = mountThread();
		useChatAccountStore().account = {
			contact: {
				iss: 'iss',
				sub: 'agent',
			},
		} as never;
		await withThread(wrapper);

		expect(chatThread(wrapper).props('selfMemberId')).toBe('member-self');
	});
});
