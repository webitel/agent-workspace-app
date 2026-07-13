import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TheChatsWorkspace from '../the-chats-workspace.vue';

const routeParams = {
	threadId: '' as string,
};
const routerReplaceMock = vi.fn();
vi.mock('vue-router', () => ({
	useRoute: () => ({
		params: routeParams,
	}),
	useRouter: () => ({
		replace: (...args: unknown[]) => routerReplaceMock(...args),
	}),
}));

const isOpenMock = vi.fn((..._args: unknown[]) => true);
vi.mock('../../../../../../features/chats/store/chats', () => ({
	useChatsStore: () => ({
		isOpen: (...args: unknown[]) => isOpenMock(...args),
	}),
}));

vi.mock('../the-chat-previews-list.vue', () => ({
	default: {
		name: 'TheChatPreviewsList',
		template: '<div />',
	},
}));

const mountWorkspace = () =>
	mount(TheChatsWorkspace, {
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
			stubs: {
				'router-view': true,
			},
		},
	});

describe('the-chats-workspace', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		routeParams.threadId = '';
		isOpenMock.mockReturnValue(true);
	});

	it('redirects a stale chat URL to the list when the chat is not open', () => {
		routeParams.threadId = 'chat-1';
		isOpenMock.mockReturnValue(false);

		mountWorkspace();

		expect(routerReplaceMock).toHaveBeenCalledWith('/chats');
	});

	it('does not redirect when the chat is open', () => {
		routeParams.threadId = 'chat-1';

		mountWorkspace();

		expect(routerReplaceMock).not.toHaveBeenCalled();
	});

	it('does not redirect when there is no chat in the URL', () => {
		mountWorkspace();

		expect(routerReplaceMock).not.toHaveBeenCalled();
	});
});
