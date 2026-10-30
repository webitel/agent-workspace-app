import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useCallTransferPopupStore } from '../callTransferPopup';

describe('useCallTransferPopupStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	it('is closed by default', () => {
		const store = useCallTransferPopupStore();

		expect(store.isOpenTransferPopup).toBe(false);
		expect(store.transferCallId).toBeNull();
	});

	it('opens for a call', () => {
		const store = useCallTransferPopupStore();

		store.open('call-1');

		expect(store.isOpenTransferPopup).toBe(true);
		expect(store.transferCallId).toBe('call-1');
	});

	it('closes', () => {
		const store = useCallTransferPopupStore();
		store.open('call-1');

		store.close();

		expect(store.isOpenTransferPopup).toBe(false);
		expect(store.transferCallId).toBeNull();
	});
});
