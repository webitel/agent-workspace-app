import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useNumpadStore } from '../numpad';

describe('useNumpadStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	it('is closed by default', () => {
		const store = useNumpadStore();

		expect(store.isOpen).toBe(false);
	});

	it('opens and closes explicitly', () => {
		const store = useNumpadStore();

		store.open();
		expect(store.isOpen).toBe(true);

		store.close();
		expect(store.isOpen).toBe(false);
	});

	it('toggles between open and closed', () => {
		const store = useNumpadStore();

		store.toggle();
		expect(store.isOpen).toBe(true);

		store.toggle();
		expect(store.isOpen).toBe(false);
	});
});
