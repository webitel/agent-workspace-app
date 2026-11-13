import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useCallBridgePopupStore } from '../callBridgePopup';

describe('useCallBridgePopupStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	it('is closed by default', () => {
		const store = useCallBridgePopupStore();

		expect(store.isOpenBridgePopup).toBe(false);
		expect(store.bridgeCallId).toBeNull();
	});

	it('opens for a call', () => {
		const store = useCallBridgePopupStore();

		store.open('call-1');

		expect(store.isOpenBridgePopup).toBe(true);
		expect(store.bridgeCallId).toBe('call-1');
	});

	it('closes', () => {
		const store = useCallBridgePopupStore();
		store.open('call-1');

		store.close();

		expect(store.isOpenBridgePopup).toBe(false);
		expect(store.bridgeCallId).toBeNull();
	});
});
