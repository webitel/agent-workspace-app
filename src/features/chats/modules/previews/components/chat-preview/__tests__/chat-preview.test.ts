import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const openChatMock = vi.fn();
const chatsStore = {
	openChat: openChatMock,
	mainChat: undefined as
		| {
				id: string;
		  }
		| undefined,
};
vi.mock('../../../../../store/chats', () => ({
	useChatsStore: () => chatsStore,
}));

const previewsStore = {
	lastMessages: {} as Record<string, unknown>,
};
vi.mock('../../../store/chat-previews', () => ({
	useChatPreviewsStore: () => previewsStore,
}));

const accountStore = {
	account: null as unknown,
};
vi.mock('../../../../../store/chat-account', () => ({
	useChatAccountStore: () => accountStore,
}));

import ChatPreview from '../chat-preview.vue';

const account = {
	contact: {
		sub: '42',
		iss: 'webitel',
	},
};

// the thread is the snapshot a task carries from distribution: the row reads its
// id and nothing else, so its text and members are made to look stale on purpose
const buildTask = (overrides: Record<string, unknown> = {}) =>
	({
		displayName: 'John Smith',
		displayNumber: '@john',
		queue: {
			id: 1,
			name: 'Support',
		},
		thread: {
			id: 't1',
			lastMsg: 'text from distribution',
			members: [],
		},
		...overrides,
	}) as never;

const mountPreview = (task = buildTask()) =>
	mount(ChatPreview, {
		props: {
			task,
		},
	});

// 09:05 today, so the row shows a clock time whatever day the suite runs
const today0905 = new Date().setHours(9, 5, 0, 0);

describe('chat-preview', () => {
	beforeEach(() => {
		openChatMock.mockClear();
		chatsStore.mainChat = undefined;
		previewsStore.lastMessages = {
			t1: {
				id: 'm1',
				body: 'message text',
				at: today0905,
				senderContact: {
					sub: 'client-1',
					iss: 'telegram',
				},
			},
		};
		accountStore.account = account;
	});

	it('shows who the client is, the last message and the queue', () => {
		const wrapper = mountPreview();

		expect(wrapper.find('.client-identity-block__name').text()).toBe('@john');
		expect(wrapper.find('.chat-preview-body__text').text()).toBe(
			'message text',
		);
		expect(wrapper.find('.chat-preview-footer').text()).toContain('Support');
	});

	it('shows when the last message was sent', () => {
		expect(mountPreview().find('.chat-preview__time').text()).toBe('09:05');
	});

	it('opens the chat by its thread id on click', async () => {
		await mountPreview().trigger('click');

		expect(openChatMock).toHaveBeenCalledWith('t1');
	});

	describe('selected state', () => {
		it('is selected while its chat is the one open in the central panel', () => {
			chatsStore.mainChat = {
				id: 't1',
			};
			const wrapper = mountPreview();

			expect(wrapper.classes()).toContain('chat-preview--selected');
			expect(wrapper.attributes('aria-current')).toBe('true');
		});

		it('is not selected while another chat is open', () => {
			chatsStore.mainChat = {
				id: 'other',
			};
			const wrapper = mountPreview();

			expect(wrapper.classes()).not.toContain('chat-preview--selected');
			expect(wrapper.attributes('aria-current')).toBeUndefined();
		});

		it('is not selected while no chat is open', () => {
			expect(mountPreview().classes()).not.toContain('chat-preview--selected');
		});
	});

	describe('who wrote the last message', () => {
		it("shows the client's message in the client look", () => {
			const wrapper = mountPreview();

			expect(wrapper.find('.chat-preview-body').classes()).toContain(
				'chat-preview-body--client',
			);
			expect(wrapper.find('.chat-preview-body .wt-avatar').exists()).toBe(true);
		});

		it("shows the agent's own message in the agent look", () => {
			previewsStore.lastMessages = {
				t1: {
					id: 'm1',
					body: 'my reply',
					at: today0905,
					senderContact: {
						sub: '42',
						iss: 'webitel',
					},
				},
			};
			const wrapper = mountPreview();

			expect(wrapper.find('.chat-preview-body').classes()).toContain(
				'chat-preview-body--agent',
			);
		});

		// the agent's account has not loaded: no avatar rather than a wrong one
		it('shows no avatar while it cannot be told', () => {
			accountStore.account = null;
			const wrapper = mountPreview();

			expect(wrapper.find('.chat-preview-body__text').text()).toBe(
				'message text',
			);
			expect(wrapper.find('.chat-preview-body .wt-avatar').exists()).toBe(
				false,
			);
		});
	});

	describe('before the last message is known', () => {
		beforeEach(() => {
			previewsStore.lastMessages = {};
		});

		// the task's text is a snapshot nothing refreshes: not worth showing
		it('shows the chat but no message, though the task carries text', () => {
			const wrapper = mountPreview();

			expect(wrapper.find('.client-identity-block__name').text()).toBe('@john');
			expect(wrapper.find('.chat-preview-body').exists()).toBe(false);
			expect(wrapper.find('.chat-preview__time').exists()).toBe(false);
		});
	});

	it('shows no queue line for a chat without a queue', () => {
		const wrapper = mountPreview(
			buildTask({
				queue: undefined,
			}),
		);

		expect(wrapper.find('.chat-preview-footer').exists()).toBe(false);
	});
});
