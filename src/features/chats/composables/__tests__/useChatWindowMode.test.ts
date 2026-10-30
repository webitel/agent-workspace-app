import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive, ref } from 'vue';

// The window decides from the task feed alone; the coordinator is the only
// place that knows it, so a stand-in for it is all the composable needs.
const feed = reactive({
	isTaskFeedReady: false,
	threadIdsWithTask: [] as string[],
});

vi.mock('../../store/chats', () => ({
	useChatsStore: () => ({
		get isTaskFeedReady() {
			return feed.isTaskFeedReady;
		},
		hasChatTask: (threadId: string) =>
			feed.threadIdsWithTask.includes(threadId),
	}),
}));

const useClosedChatStoreMock = vi.fn();

vi.mock('../../modules/closed/store/closed-chat', () => ({
	useClosedChatStore: (threadId: string) => useClosedChatStoreMock(threadId),
}));

import { useChatWindowMode } from '../useChatWindowMode';

describe('useChatWindowMode', () => {
	beforeEach(() => {
		feed.isTaskFeedReady = false;
		feed.threadIdsWithTask = [];
		useClosedChatStoreMock.mockReset();
	});

	// a deep-linked active chat must not flash as closed before the feed is back
	it('waits while the task feed is not ready, even with no task for the thread', () => {
		const mode = useChatWindowMode(ref('thread-1'));

		expect(mode.value).toBe('pending');
	});

	it('is active when the feed has a task for the thread', () => {
		feed.isTaskFeedReady = true;
		feed.threadIdsWithTask = [
			'thread-1',
		];

		const mode = useChatWindowMode(ref('thread-1'));

		expect(mode.value).toBe('active');
	});

	// the agent left the thread once and rejoined it: an active chat only (ADR-0010)
	it('is active for a thread the agent has also left before', () => {
		useClosedChatStoreMock.mockReturnValue({
			thread: {
				id: 'thread-1',
			},
			isNotFound: false,
		});
		feed.isTaskFeedReady = true;
		feed.threadIdsWithTask = [
			'thread-1',
		];

		const mode = useChatWindowMode(ref('thread-1'));

		expect(mode.value).toBe('active');
		expect(useClosedChatStoreMock).not.toHaveBeenCalled();
	});

	it('is closed when the feed is ready and has no task for the thread', () => {
		feed.isTaskFeedReady = true;

		const mode = useChatWindowMode(ref('thread-1'));

		expect(mode.value).toBe('closed');
	});

	it('turns closed when the task leaves the feed', async () => {
		feed.isTaskFeedReady = true;
		feed.threadIdsWithTask = [
			'thread-1',
		];
		const mode = useChatWindowMode(ref('thread-1'));
		expect(mode.value).toBe('active');

		feed.threadIdsWithTask = [];
		await nextTick();

		expect(mode.value).toBe('closed');
	});

	it('follows the thread the window shows', () => {
		feed.isTaskFeedReady = true;
		feed.threadIdsWithTask = [
			'thread-1',
		];
		const threadId = ref('thread-1');
		const mode = useChatWindowMode(threadId);

		threadId.value = 'thread-2';

		expect(mode.value).toBe('closed');
	});
});
