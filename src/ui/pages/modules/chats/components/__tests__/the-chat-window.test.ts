import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatSessionStore } from '../../../../../../features/chats/store/chat-session';
import TheChatWindow from '../the-chat-window.vue';

const routerReplaceMock = vi.fn();
vi.mock('vue-router', () => ({
	useRoute: () => ({
		params: {
			threadId: 'chat-1',
		},
	}),
	useRouter: () => ({
		replace: (...args: unknown[]) => routerReplaceMock(...args),
	}),
}));

// The window renders only for a chat that is open in the coordinator; default
// the mock to open so the presentation tests exercise a live window.
const isOpenMock = vi.fn((..._args: unknown[]) => true);
vi.mock('../../../../../../features/chats/store/chats', () => ({
	useChatsStore: () => ({
		isOpen: (...args: unknown[]) => isOpenMock(...args),
	}),
}));

// Mock the ui-chats /ui entry: importing the real ChatContainer pulls the
// styleguide/ui-sdk asset tree (svg?raw) that vitest refuses to transform.
// A lightweight stub that captures props and re-emits the wired events is
// enough to exercise the window's binding logic. The /adapters entry is
// type-only and stays real, so message mapping is exercised for real.
vi.mock('@webitel/ui-chats/ui', () => ({
	ChatAction: {
		SendMessage: 'sendMessage',
		AttachFiles: 'attachFiles',
	},
	ChatContainer: {
		name: 'ChatContainer',
		props: [
			'messages',
			'chatActions',
			'canLoadNextMessages',
			'isNextMessagesLoading',
		],
		emits: [
			'load-next-messages',
			'action:sendMessage',
			'action:attachFiles',
		],
		template: '<div class="chat-container-stub" />',
	},
}));

const mountWindow = () =>
	mount(TheChatWindow, {
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
		},
	});

const container = (wrapper: ReturnType<typeof mountWindow>) =>
	wrapper.findComponent({
		name: 'ChatContainer',
	});

describe('the-chat-window', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		isOpenMock.mockReturnValue(true);
	});

	it('redirects to the list when the chat is not open (stale URL)', () => {
		isOpenMock.mockReturnValue(false);

		mountWindow();

		expect(routerReplaceMock).toHaveBeenCalledWith('/chats');
	});

	it('does not redirect when the chat is open', () => {
		mountWindow();

		expect(routerReplaceMock).not.toHaveBeenCalled();
	});

	it('maps store messages into the container and mirrors paging state', async () => {
		const wrapper = mountWindow();
		const store = useChatSessionStore('chat-1');
		store.messages = [
			{
				id: 'm1',
				body: 'hello',
			},
		] as never;
		store.olderCursor = 'cursor-1';
		store.isLoading = true;
		await wrapper.vm.$nextTick();

		expect(container(wrapper).props('messages')).toEqual([
			expect.objectContaining({
				id: 'm1',
				text: 'hello',
			}),
		]);
		expect(container(wrapper).props('canLoadNextMessages')).toBe(true);
		expect(container(wrapper).props('isNextMessagesLoading')).toBe(true);
	});

	it('routes the load-next-messages event to store.loadMore', async () => {
		const wrapper = mountWindow();
		const store = useChatSessionStore('chat-1');

		await container(wrapper).vm.$emit('load-next-messages');

		expect(store.loadMore).toHaveBeenCalledOnce();
	});

	it('sends text and resolves onSuccess on a successful send', async () => {
		const wrapper = mountWindow();
		const store = useChatSessionStore('chat-1');
		const onSuccess = vi.fn();
		const onComplete = vi.fn();

		await container(wrapper).vm.$emit('action:sendMessage', 'hi', {
			onSuccess,
			onComplete,
		});
		await wrapper.vm.$nextTick();

		expect(store.sendText).toHaveBeenCalledWith('hi');
		expect(onSuccess).toHaveBeenCalledOnce();
		expect(onComplete).toHaveBeenCalledOnce();
	});

	it('reports onError when a send rejects', async () => {
		const wrapper = mountWindow();
		const store = useChatSessionStore('chat-1');
		const failure = new Error('boom');
		vi.mocked(store.sendText).mockRejectedValueOnce(failure);
		const onSuccess = vi.fn();
		const onError = vi.fn();
		const onComplete = vi.fn();

		await container(wrapper).vm.$emit('action:sendMessage', 'hi', {
			onSuccess,
			onError,
			onComplete,
		});
		await wrapper.vm.$nextTick();

		expect(onSuccess).not.toHaveBeenCalled();
		expect(onError).toHaveBeenCalledWith(failure);
		expect(onComplete).toHaveBeenCalledOnce();
	});

	it('routes the attach-files event to store.sendFiles', async () => {
		const wrapper = mountWindow();
		const store = useChatSessionStore('chat-1');
		const files = [
			{
				name: 'a.png',
			},
		] as never;
		const onSuccess = vi.fn();

		await container(wrapper).vm.$emit('action:attachFiles', files, {
			onSuccess,
		});
		await wrapper.vm.$nextTick();

		expect(store.sendFiles).toHaveBeenCalledWith(files);
		expect(onSuccess).toHaveBeenCalledOnce();
	});
});
