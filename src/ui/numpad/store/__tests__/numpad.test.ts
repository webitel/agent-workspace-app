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

	it('remembers the number it was opened with', () => {
		const store = useNumpadStore();

		store.open('0671234567');

		expect(store.prefilledNumber).toBe('0671234567');
	});

	it('forgets the previous number when opened without one', () => {
		const store = useNumpadStore();

		store.open('0671234567');
		store.close();
		store.toggle();

		expect(store.prefilledNumber).toBe('');
	});

	it('toggles between open and closed', () => {
		const store = useNumpadStore();

		store.toggle();
		expect(store.isOpen).toBe(true);

		store.toggle();
		expect(store.isOpen).toBe(false);
	});
});
