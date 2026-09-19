import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { type Call, CallDirection } from 'webitel-sdk';

import { useOffersStore } from '../../../../ui/notifications/modules/offers/store/offers';
import { useCallsStore } from '../calls';

const calls = ref<Call[]>([]);
const subscribeCall = vi.fn();
const isMicrophoneAllowed = vi.fn(async () => true);

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		calls,
		getClient: () => ({
			subscribeCall,
		}),
	}),
}));
vi.mock('../../scripts/mediaPermissions', () => ({
	isMicrophoneAllowed: () => isMicrophoneAllowed(),
}));
// keep the audio/SW side effects out of this suite — they have their own tests
vi.mock('../../../../ui/notifications/sound/useRingtone', () => ({
	useRingtone: () => ({
		start: vi.fn(),
		stop: vi.fn(),
	}),
}));
vi.mock('../../../../ui/notifications/push/useOsNotifications', () => ({
	useOsNotifications: () => ({
		initialize: vi.fn(),
		show: vi.fn(),
		close: vi.fn(),
	}),
}));
vi.mock('../../../../app/locale/i18n', () => ({
	default: {
		global: {
			t: (key: string) => key,
		},
	},
}));

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		id: 'call-1',
		direction: CallDirection.Inbound,
		allowAnswer: true,
		allowHangup: true,
		isEavesdrop: false,
		queue: null,
		params: {},
		displayName: 'John Smith',
		displayNumber: '380671234678',
		hideNumber: false,
		hideContact: false,
		createdAt: Date.now(),
		answer: vi.fn(),
		hangup: vi.fn(),
		...overrides,
	}) as unknown as Call;

describe('useCallsStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		calls.value = [];
		subscribeCall.mockClear();
		isMicrophoneAllowed.mockClear();
		isMicrophoneAllowed.mockResolvedValue(true);
	});

	it('raises an offer when a ringing call appears', async () => {
		const store = useCallsStore();
		const interactions = useOffersStore();
		store.initialize();

		calls.value = [
			buildCall(),
		];
		await nextTick();

		expect(interactions.offers).toHaveLength(1);
		expect(interactions.offers[0].id).toBe('call-1');
	});

	it('ignores calls that are not offers', async () => {
		const store = useCallsStore();
		const interactions = useOffersStore();
		store.initialize();

		calls.value = [
			buildCall({
				isEavesdrop: true,
			}),
		];
		await nextTick();

		expect(interactions.offers).toHaveLength(0);
	});

	/**
	 * The whole point of deriving offers: a call leaving the answerable state for
	 * any reason (answered elsewhere, abandoned, redistributed) drops the card
	 * without us enumerating terminal actions.
	 */
	it('withdraws the offer when the call stops being answerable', async () => {
		const store = useCallsStore();
		const interactions = useOffersStore();
		store.initialize();

		const call = buildCall();
		calls.value = [
			call,
		];
		await nextTick();
		expect(interactions.offers).toHaveLength(1);

		// the SDK mutates the Call in place; go through the reactive proxy the way
		// the real `callStore` (reactive()'d in webSocketClientManager) does
		(
			calls.value[0] as unknown as {
				allowAnswer: boolean;
			}
		).allowAnswer = false;
		await nextTick();

		expect(interactions.offers).toHaveLength(0);
	});

	it('withdraws the offer when the call disappears entirely', async () => {
		const store = useCallsStore();
		const interactions = useOffersStore();
		store.initialize();

		calls.value = [
			buildCall(),
		];
		await nextTick();

		calls.value = [];
		await nextTick();

		expect(interactions.offers).toHaveLength(0);
	});

	it('answers the call behind the accepted offer', async () => {
		const store = useCallsStore();
		store.initialize();

		const call = buildCall();
		calls.value = [
			call,
		];
		await nextTick();

		await store.answer('call-1');

		expect(call.answer).toHaveBeenCalledWith(
			expect.objectContaining({
				audio: true,
			}),
		);
	});

	// a denied mic yields a connected call the customer hears nothing on
	it('refuses to answer when the microphone is blocked', async () => {
		isMicrophoneAllowed.mockResolvedValue(false);

		const store = useCallsStore();
		store.initialize();

		const call = buildCall();
		calls.value = [
			call,
		];
		await nextTick();

		await store.answer('call-1');

		expect(call.answer).not.toHaveBeenCalled();
	});

	it('hangs up the call behind the declined offer', async () => {
		const store = useCallsStore();
		store.initialize();

		const call = buildCall();
		calls.value = [
			call,
		];
		await nextTick();

		await store.hangup('call-1');

		expect(call.hangup).toHaveBeenCalledTimes(1);
	});

	it('does nothing when asked to answer an unknown call', async () => {
		const store = useCallsStore();
		store.initialize();

		await expect(store.answer('nope')).resolves.toBeUndefined();
	});
});
