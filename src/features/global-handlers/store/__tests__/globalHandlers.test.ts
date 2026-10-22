import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketClientEvent } from '../../../../app/api/socket/enums/WebSocketClientEvent.enum';

const onMock = vi.fn();

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		on: onMock,
		getClient: () => ({
			phoneIsRegister: () => false,
		}),
	}),
}));

const systemSettingsStore = {
	applyChange: vi.fn(),
	initialize: vi.fn(),
	reload: vi.fn(),
};

vi.mock('../../../system-settings/store/systemSettings', () => ({
	useSystemSettingsStore: () => systemSettingsStore,
}));

import { useGlobalHandlersStore } from '../globalHandlers';

const getHandlers = (event: string) =>
	onMock.mock.calls.filter(([e]) => e === event).map(([, cb]) => cb);

describe('useGlobalHandlersStore', () => {
	beforeEach(() => {
		onMock.mockClear();
		systemSettingsStore.applyChange.mockReset();
		systemSettingsStore.initialize.mockReset().mockResolvedValue(undefined);
		systemSettingsStore.reload.mockReset().mockResolvedValue(undefined);
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	describe('system settings', () => {
		it('loads system settings and applies their change events', () => {
			useGlobalHandlersStore().initialize();

			expect(systemSettingsStore.initialize).toHaveBeenCalledTimes(1);
			expect(getHandlers(WebSocketClientEvent.SystemSettingsChanged)).toEqual([
				systemSettingsStore.applyChange,
			]);
		});

		it('reloads system settings after a reconnect', () => {
			useGlobalHandlersStore().initialize();

			getHandlers(WebSocketClientEvent.AfterAuth).forEach((cb) => {
				cb();
			});

			expect(systemSettingsStore.reload).toHaveBeenCalledTimes(1);
		});

		it('subscribes once, since the client is kept across reconnects', () => {
			const store = useGlobalHandlersStore();

			store.initialize();
			store.initialize();

			expect(
				getHandlers(WebSocketClientEvent.SystemSettingsChanged),
			).toHaveLength(1);
			expect(systemSettingsStore.initialize).toHaveBeenCalledTimes(1);
		});
	});
});
