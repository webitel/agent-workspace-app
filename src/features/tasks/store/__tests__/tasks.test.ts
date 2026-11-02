import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

const tasks = ref<
	{
		id: number;
		channel: string;
		allowAccept: boolean;
		offeringAt: number;
		accept?: () => Promise<void>;
		decline?: () => Promise<void>;
	}[]
>([]);

const offers = {
	// biome-ignore lint/suspicious/noExplicitAny: test double for the store action
	notify: vi.fn() as any,
	retainOnly: vi.fn(),
};

vi.mock('../../../../ui/notifications/modules/offers/store/offers', () => ({
	useOffersStore: () => offers,
}));

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		tasks,
	}),
}));

import { useTasksStore } from '../tasks';

const buildOffer = (id = 1, channel = 'task') => ({
	id,
	channel,
	allowAccept: true,
	offeringAt: 1,
	accept: vi.fn(async () => {}),
	decline: vi.fn(async () => {}),
});

describe('tasks store', () => {
	/**
	 * The store watches a module-level `tasks` ref. Without disposing, every
	 * previous test's store keeps watching it, so a later mutation fires all of
	 * them and `notify.mock.calls[0]` belongs to a stale store.
	 */
	let pinia: ReturnType<typeof createTestingPinia> | null = null;

	afterEach(() => {
		// `_s` is pinia's internal store registry; `$dispose` on each is public
		const registry = (
			pinia as unknown as {
				_s?: Map<
					string,
					{
						$dispose: () => void;
					}
				>;
			} | null
		)?._s;
		registry?.forEach((store) => {
			store.$dispose();
		});
		pinia = null;
	});

	beforeEach(() => {
		pinia = createTestingPinia({
			stubActions: false,
			createSpy: vi.fn,
		});
		setActivePinia(pinia);
		vi.clearAllMocks();
		tasks.value = [];
	});

	it('raises an offer when a job starts being offered', async () => {
		useTasksStore().initialize();

		tasks.value = [
			buildOffer(),
		];
		await nextTick();

		expect(offers.notify).toHaveBeenCalledTimes(1);
		expect(offers.notify.mock.calls[0][0].id).toBe('1');
	});

	// calls and chats raise their own offers from the same feed
	it('ignores tasks of other channels', async () => {
		useTasksStore().initialize();

		tasks.value = [
			buildOffer(1, 'im'),
		];
		await nextTick();

		expect(offers.notify).not.toHaveBeenCalled();
	});

	/**
	 * Derived, not pushed: the card leaves on every exit path without the store
	 * enumerating task actions.
	 */
	it('withdraws the offer once the job stops being offered', async () => {
		useTasksStore().initialize();

		tasks.value = [
			buildOffer(),
		];
		await nextTick();

		tasks.value[0].allowAccept = false;
		await nextTick();

		expect(offers.retainOnly).toHaveBeenLastCalledWith('task', []);
	});

	it('accepts and declines through the job itself', async () => {
		useTasksStore().initialize();

		const offer = buildOffer();
		tasks.value = [
			offer,
		];
		await nextTick();

		const { onAccept, onDecline } = offers.notify.mock.calls[0][0];
		await onAccept();
		await onDecline();

		expect(offer.accept).toHaveBeenCalledTimes(1);
		expect(offer.decline).toHaveBeenCalledTimes(1);
	});
});
