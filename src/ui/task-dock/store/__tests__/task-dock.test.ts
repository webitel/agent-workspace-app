import { createTestingPinia } from '@pinia/testing';
import { createEventHook } from '@vueuse/core';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import type { Call } from 'webitel-sdk';

import { useTaskDockStore } from '../task-dock';

/**
 * @author Oleksandr Palonnyi
 * The attempts store is replaced by its answered hook, which is all the dock store
 * listens to
 * [WS-155](https://webitel.atlassian.net/browse/WS-155)
 */
const answeredHook = createEventHook<string>();

vi.mock('../../../../features/calls/store/outboundCallAttempts', () => ({
	useOutboundCallAttemptsStore: () => ({
		onAttemptAnswered: answeredHook.on,
	}),
}));

/**
 * @author Oleksandr Palonnyi
 * The calls store is replaced by its active calls, which is all the dock store
 * reads to tell an open dock from a stale id
 * [WS-155](https://webitel.atlassian.net/browse/WS-155)
 */
const callsStore = reactive({
	activeCalls: [] as Call[],
});

vi.mock('../../../../features/calls/store/calls', () => ({
	useCallsStore: () => callsStore,
}));

function setActiveCallIds(callIds: string[], heldCallIds: string[] = []): void {
	callsStore.activeCalls = callIds.map(
		(id) =>
			({
				id,
				isHold: heldCallIds.includes(id),
			}) as Call,
	);
}

describe('useTaskDockStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		setActiveCallIds([]);
	});

	it('expands a call', () => {
		const store = useTaskDockStore();

		store.setCallExpanded('call-1', true);

		expect(store.expandedCallId).toBe('call-1');
	});

	it('collapses the expanded call', () => {
		const store = useTaskDockStore();
		store.setCallExpanded('call-1', true);

		store.setCallExpanded('call-1', false);

		expect(store.expandedCallId).toBeNull();
	});

	it('keeps another call expanded when a different one is collapsed', () => {
		const store = useTaskDockStore();
		store.setCallExpanded('call-2', true);

		store.setCallExpanded('call-1', false);

		expect(store.expandedCallId).toBe('call-2');
	});

	it('keeps only one call expanded at a time', () => {
		const store = useTaskDockStore();

		store.setCallExpanded('call-1', true);
		store.setCallExpanded('call-2', true);

		expect(store.expandedCallId).toBe('call-2');
	});

	it('stays expanded when the same call is expanded twice', () => {
		const store = useTaskDockStore();

		store.setCallExpanded('call-1', true);
		store.setCallExpanded('call-1', true);

		expect(store.expandedCallId).toBe('call-1');
	});

	it('expands a chat on first toggle and collapses on second', () => {
		const store = useTaskDockStore();

		store.toggleChatExpand('chat-1');
		expect(store.expandedChatId).toBe('chat-1');

		store.toggleChatExpand('chat-1');
		expect(store.expandedChatId).toBeNull();
	});

	it('keeps call and chat expand state in separate lanes', () => {
		const store = useTaskDockStore();

		store.setCallExpanded('call-1', true);
		store.toggleChatExpand('chat-1');

		store.setCallExpanded('call-1', false);

		expect(store.expandedCallId).toBeNull();
		expect(store.expandedChatId).toBe('chat-1');
	});

	describe('expandAnsweredCall', () => {
		it('expands the call when none is expanded', () => {
			const store = useTaskDockStore();

			store.expandAnsweredCall('call-1');

			expect(store.expandedCallId).toBe('call-1');
		});

		it('keeps the call the agent has open', () => {
			const store = useTaskDockStore();
			setActiveCallIds([
				'call-1',
				'call-2',
			]);
			store.setCallExpanded('call-1', true);

			store.expandAnsweredCall('call-2');

			expect(store.expandedCallId).toBe('call-1');
		});

		it('expands the call when the expanded one is on hold', () => {
			const store = useTaskDockStore();
			setActiveCallIds(
				[
					'call-1',
					'call-2',
				],
				[
					'call-1',
				],
			);
			store.setCallExpanded('call-1', true);

			store.expandAnsweredCall('call-2');

			expect(store.expandedCallId).toBe('call-2');
		});

		it('expands the first of two calls answered together', () => {
			const store = useTaskDockStore();
			setActiveCallIds([
				'call-1',
				'call-2',
			]);

			store.expandAnsweredCall('call-1');
			store.expandAnsweredCall('call-2');

			expect(store.expandedCallId).toBe('call-1');
		});

		it('expands the call when the expanded one has ended', () => {
			const store = useTaskDockStore();
			setActiveCallIds([
				'call-1',
			]);
			store.setCallExpanded('call-1', true);
			setActiveCallIds([
				'call-2',
			]);

			store.expandAnsweredCall('call-2');

			expect(store.expandedCallId).toBe('call-2');
		});
	});

	describe('initialize', () => {
		it('expands a call the callee answers', async () => {
			const store = useTaskDockStore();
			store.initialize();

			await answeredHook.trigger('call-1');

			expect(store.expandedCallId).toBe('call-1');
		});
	});
});
