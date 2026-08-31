import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useNotificationsStore } from '../notifications';

describe('useNotificationsStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	it('appends a notification and returns its id', () => {
		const store = useNotificationsStore();

		const id = store.notify({
			text: 'New chat',
			actions: [],
		});

		expect(store.notifications).toHaveLength(1);
		expect(store.notifications[0].id).toBe(id);
		expect(store.notifications[0].text).toBe('New chat');
	});

	it('gives each notification a distinct id', () => {
		const store = useNotificationsStore();

		const first = store.notify({
			text: 'a',
			actions: [],
		});
		const second = store.notify({
			text: 'b',
			actions: [],
		});

		expect(first).not.toBe(second);
	});

	it('dismisses a notification by id', () => {
		const store = useNotificationsStore();

		const id = store.notify({
			text: 'New chat',
			actions: [],
		});
		store.dismiss(id);

		expect(store.notifications).toHaveLength(0);
	});

	it('runs an action handler then dismisses the notification', () => {
		const store = useNotificationsStore();
		const handler = vi.fn();

		const id = store.notify({
			text: 'New chat',
			actions: [
				{
					label: 'Accept',
					handler,
				},
			],
		});
		store.runAction(id, {
			label: 'Accept',
			handler,
		});

		expect(handler).toHaveBeenCalledOnce();
		expect(store.notifications).toHaveLength(0);
	});
});
