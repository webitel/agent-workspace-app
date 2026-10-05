import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatSessionStore } from '../../../../../../features/chats/store/chat-session';
import TheChatThread from '../the-chat-thread.vue';

vi.mock('vue-router', () => ({
	useRoute: () => ({
		params: {
			threadId: 'chat-1',
		},
	}),
}));

// Mock the ui-chats /v2 entry: importing the real ChatThread pulls the
// styleguide/ui-sdk asset tree (svg?raw) that vitest refuses to transform.
// A stub that captures props is enough to check the thread's wiring.
vi.mock('@webitel/ui-chats/v2', () => ({
	ChatThreadMode: {
		Awaiting: 'awaiting',
		Active: 'active',
		Readonly: 'readonly',
	},
	ChatComposerAction: {
		Attach: 'attach',
		Emoji: 'emoji',
		Send: 'send',
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
		],
		emits: [
			'seen',
		],
		template: '<div class="chat-thread-stub" />',
	},
}));

const mountThread = (props = {}) =>
	mount(TheChatThread, {
		props,
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
	const store = useChatSessionStore('chat-1');
	store.thread = {
		id: 'chat-1',
		members: [],
	} as never;
	await wrapper.vm.$nextTick();
	return store;
};

describe('the-chat-thread', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders nothing until the thread has loaded', () => {
		const wrapper = mountThread();
		expect(chatThread(wrapper).exists()).toBe(false);
	});

	it('passes the store’s thread, messages and paging state through', async () => {
		const wrapper = mountThread();
		const store = await withThread(wrapper);
		store.messages = [
			{
				id: 'm1',
				body: 'hello',
			},
		] as never;
		store.olderCursor = 'cursor-1';
		await wrapper.vm.$nextTick();

		expect(chatThread(wrapper).props('thread')).toMatchObject({
			id: 'chat-1',
		});
		expect(chatThread(wrapper).props('messages')).toEqual([
			expect.objectContaining({
				id: 'm1',
			}),
		]);
		expect(chatThread(wrapper).props('hasMore')).toBe(true);
		expect(chatThread(wrapper).props('actions')).toEqual([
			'attach',
			'emoji',
			'send',
		]);
	});

	it('hands the store’s async actions straight to ChatThread', async () => {
		const wrapper = mountThread();
		const store = await withThread(wrapper);

		expect(chatThread(wrapper).props('onSend')).toBe(store.sendText);
		expect(chatThread(wrapper).props('onAttach')).toBe(store.sendFiles);
		expect(chatThread(wrapper).props('onLoadMore')).toBe(store.loadMore);
	});

	it('passes the mode the chat window decided, read-only by default', async () => {
		const wrapper = mountThread();
		await withThread(wrapper);
		expect(chatThread(wrapper).props('mode')).toBe('readonly');

		await wrapper.setProps({
			mode: 'active',
		});
		expect(chatThread(wrapper).props('mode')).toBe('active');
	});

	it('marks a seen message read', async () => {
		const wrapper = mountThread();
		await withThread(wrapper);
		const markRead = vi.fn().mockResolvedValue(undefined);

		await chatThread(wrapper).vm.$emit('seen', {
			id: 'm1',
			markRead,
		});

		expect(markRead).toHaveBeenCalledOnce();
	});
});
