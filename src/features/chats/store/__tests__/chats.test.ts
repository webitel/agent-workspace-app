import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const subscribeTaskMock = vi.fn();
const getClientMock = vi.fn(() => ({
	subscribeTask: subscribeTaskMock,
}));
const tasks = ref<
	{
		channel: string;
	}[]
>([]);

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		getClient: getClientMock,
		tasks,
	}),
}));

const loadMock = vi.fn();
const useChatSessionStoreMock = vi.fn((..._args: unknown[]) => ({
	load: loadMock,
}));
const disposeChatSessionMock = vi.fn();

vi.mock('../chat-session', () => ({
	useChatSessionStore: (...args: unknown[]) => useChatSessionStoreMock(...args),
	disposeChatSession: (...args: unknown[]) => disposeChatSessionMock(...args),
}));

import { useChatsStore } from '../chats';

describe('chats store', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
				createSpy: vi.fn,
			}),
		);
		vi.clearAllMocks();
		tasks.value = [];
	});

	it('subscribes to tasks on the connected client on initialize', () => {
		const store = useChatsStore();

		store.initialize();

		expect(subscribeTaskMock).toHaveBeenCalledOnce();
		expect(subscribeTaskMock).toHaveBeenCalledWith(expect.any(Function));
	});

	it('exposes only im-channel tasks in chatTaskList', () => {
		tasks.value = [
			{
				channel: 'im',
			},
			{
				channel: 'call',
			},
			{
				channel: 'im',
			},
		];
		const store = useChatsStore();

		expect(store.chatTaskList).toHaveLength(2);
		expect(store.chatTaskList?.every((task) => task.channel === 'im')).toBe(
			true,
		);
	});

	describe('openChat', () => {
		it('opens a chat as main and warms its session store', () => {
			const store = useChatsStore();

			store.openChat('chat-1');

			expect(store.isOpen('chat-1')).toBe(true);
			expect(store.mainChat?.id).toBe('chat-1');
			expect(useChatSessionStoreMock).toHaveBeenCalledWith('chat-1');
			expect(loadMock).toHaveBeenCalledOnce();
		});

		it('demotes the previous main when a new chat opens as main', () => {
			const store = useChatsStore();

			store.openChat('chat-1');
			store.openChat('chat-2');

			expect(store.mainChat?.id).toBe('chat-2');
			expect(store.minimizedChats.map((chat) => chat.id)).toEqual([
				'chat-1',
			]);
		});

		it('does not duplicate an already open chat', () => {
			const store = useChatsStore();

			store.openChat('chat-1');
			store.openChat('chat-1', 'minimized');

			expect(store.openChats).toHaveLength(1);
			expect(store.mainChat).toBeUndefined();
			expect(store.minimizedChats.map((chat) => chat.id)).toEqual([
				'chat-1',
			]);
		});
	});

	describe('setMode', () => {
		it('keeps a single main window across mode changes', () => {
			const store = useChatsStore();
			store.openChat('chat-1');
			store.openChat('chat-2', 'minimized');

			store.setMode('chat-2', 'main');

			expect(store.mainChat?.id).toBe('chat-2');
			expect(store.minimizedChats.map((chat) => chat.id)).toEqual([
				'chat-1',
			]);
		});

		it('ignores unknown chat ids', () => {
			const store = useChatsStore();

			store.setMode('missing', 'main');

			expect(store.openChats).toHaveLength(0);
		});
	});

	describe('closeChat', () => {
		it('removes the chat and disposes its session store', () => {
			const store = useChatsStore();
			store.openChat('chat-1');

			store.closeChat('chat-1');

			expect(store.isOpen('chat-1')).toBe(false);
			expect(disposeChatSessionMock).toHaveBeenCalledWith('chat-1');
		});
	});
});
