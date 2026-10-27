import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useCallTransferStore } from '../callTransfer';

describe('useCallTransferStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	it('is closed by default', () => {
		const store = useCallTransferStore();

		expect(store.isOpen).toBe(false);
		expect(store.transferCallId).toBeNull();
	});

	it('opens for a call', () => {
		const store = useCallTransferStore();

		store.open('call-1');

		expect(store.isOpen).toBe(true);
		expect(store.transferCallId).toBe('call-1');
	});

	it('closes', () => {
		const store = useCallTransferStore();
		store.open('call-1');

		store.close();

		expect(store.isOpen).toBe(false);
		expect(store.transferCallId).toBeNull();
	});
});
