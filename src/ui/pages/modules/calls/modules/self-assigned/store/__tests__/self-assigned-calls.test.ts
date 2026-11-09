import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive, shallowRef } from 'vue';
import type { WaitingMemberCall } from 'webitel-sdk';

/** Stand-in for the SDK agent: only what the store reads */
const createAgent = () =>
	reactive({
		waitingListCalls: [] as WaitingMemberCall[],
		hasMoreWaitingCalls: true,
		setWaitingCallsQuery: vi.fn(),
	});

const agent = shallowRef<ReturnType<typeof createAgent> | undefined>();

vi.mock(
	'../../../../../../../../app/api/socket/composables/useWebSocketClient',
	() => ({
		useWebSocketClient: () => ({
			agent,
		}),
	}),
);

import { useSelfAssignedCallsDataListStore } from '../self-assigned-calls';

const call = {
	attemptId: 1,
} as WaitingMemberCall;

describe('self-assigned calls store', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		agent.value = createAgent();
	});

	it('hands the table params over to the SDK query', async () => {
		const store = useSelfAssignedCallsDataListStore();

		await store.loadDataList();

		expect(agent.value?.setWaitingCallsQuery).toHaveBeenCalledWith({
			q: '',
			size: 10,
			sort: null,
		});
	});

	it('takes the next page flag from the SDK', async () => {
		const store = useSelfAssignedCallsDataListStore();

		await store.loadDataList();

		expect(store.next).toBe(true);
	});

	it('follows socket updates of the agent list', async () => {
		const store = useSelfAssignedCallsDataListStore();
		await store.loadDataList();

		agent.value?.waitingListCalls.splice(0, 0, call);

		expect(store.dataList).toEqual([
			call,
		]);

		agent.value?.waitingListCalls.splice(0, 1);

		expect(store.dataList).toEqual([]);
	});

	it('loads nothing without an agent session', async () => {
		agent.value = undefined;
		const store = useSelfAssignedCallsDataListStore();

		await store.loadDataList();

		expect(store.dataList).toEqual([]);
		expect(store.next).toBe(false);
	});
});
