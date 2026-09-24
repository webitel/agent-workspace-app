import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { type Call, CallActions, CallDirection } from 'webitel-sdk';

import { mockEmit } from '../../../../../test/setup';
import { useIncomingInteractionsStore } from '../../../../ui/notifications/incoming/store/incomingInteractions';
import { useCallsStore } from '../calls';

const calls = ref<Call[]>([]);
const subscribeCall = vi.fn();
const clientCall = vi.fn(async () => undefined);
const isMicrophoneAllowed = vi.fn(async () => true);
const playRemoteAudio = vi.fn();
const stopRemoteAudio = vi.fn();

vi.mock('../../../../app/api/socket/composables/useWebSocketClient', () => ({
	useWebSocketClient: () => ({
		calls,
		getClient: () => ({
			subscribeCall,
			call: clientCall,
		}),
	}),
}));
vi.mock('../../scripts/mediaPermissions', () => ({
	isMicrophoneAllowed: () => isMicrophoneAllowed(),
}));
/**
 * @author Oleksandr Palonnyi
 * Media elements are covered by useCallAudio's own suite.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
vi.mock('../../composables/useCallAudio', () => ({
	useCallAudio: () => ({
		playRemoteAudio,
		stopRemoteAudio,
	}),
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
		active: false,
		isHold: false,
		allowHold: true,
		answer: vi.fn(),
		hangup: vi.fn(),
		hold: vi.fn(),
		...overrides,
	}) as unknown as Call;

const getCallEventHandler = () =>
	subscribeCall.mock.calls[0][0] as (action: CallActions, call: Call) => void;

describe('useCallsStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		calls.value = [];
		subscribeCall.mockClear();
		clientCall.mockReset();
		clientCall.mockResolvedValue(undefined);
		isMicrophoneAllowed.mockClear();
		isMicrophoneAllowed.mockResolvedValue(true);
		playRemoteAudio.mockClear();
		stopRemoteAudio.mockClear();
		mockEmit.mockClear();
		localStorage.clear();
	});

	it('raises an offer when a ringing call appears', async () => {
		const store = useCallsStore();
		const interactions = useIncomingInteractionsStore();
		store.initialize();

		calls.value = [
			buildCall(),
		];
		await nextTick();

		expect(interactions.interactions).toHaveLength(1);
		expect(interactions.interactions[0].id).toBe('call-1');
	});

	it('ignores calls that are not offers', async () => {
		const store = useCallsStore();
		const interactions = useIncomingInteractionsStore();
		store.initialize();

		calls.value = [
			buildCall({
				isEavesdrop: true,
			}),
		];
		await nextTick();

		expect(interactions.interactions).toHaveLength(0);
	});

	/**
	 * The whole point of deriving offers: a call leaving the answerable state for
	 * any reason (answered elsewhere, abandoned, redistributed) drops the card
	 * without us enumerating terminal actions.
	 */
	it('withdraws the offer when the call stops being answerable', async () => {
		const store = useCallsStore();
		const interactions = useIncomingInteractionsStore();
		store.initialize();

		const call = buildCall();
		calls.value = [
			call,
		];
		await nextTick();
		expect(interactions.interactions).toHaveLength(1);

		// the SDK mutates the Call in place; go through the reactive proxy the way
		// the real `callStore` (reactive()'d in webSocketClientManager) does
		(
			calls.value[0] as unknown as {
				allowAnswer: boolean;
			}
		).allowAnswer = false;
		await nextTick();

		expect(interactions.interactions).toHaveLength(0);
	});

	it('withdraws the offer when the call disappears entirely', async () => {
		const store = useCallsStore();
		const interactions = useIncomingInteractionsStore();
		store.initialize();

		calls.value = [
			buildCall(),
		];
		await nextTick();

		calls.value = [];
		await nextTick();

		expect(interactions.interactions).toHaveLength(0);
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

	describe('call', () => {
		it('dials the number with the formatting stripped', async () => {
			const store = useCallsStore();

			await expect(store.call('+38 (067) 123-45-67')).resolves.toBe(true);

			expect(clientCall).toHaveBeenCalledWith({
				destination: '+380671234567',
				params: {
					disableStun: false,
				},
			});
		});

		it('disables STUN when the CLI config turns it off', async () => {
			localStorage.setItem(
				'CONFIG',
				JSON.stringify({
					CLI: {
						stun: false,
					},
				}),
			);
			const store = useCallsStore();

			await store.call('100');

			expect(clientCall).toHaveBeenCalledWith(
				expect.objectContaining({
					params: {
						disableStun: true,
					},
				}),
			);
		});

		it('does not dial when nothing dialable was entered', async () => {
			const store = useCallsStore();

			await store.call(' - ');

			expect(clientCall).not.toHaveBeenCalled();
		});

		it('dials once when called again while the first request is in flight', async () => {
			let resolveRequest: () => void = () => {};
			clientCall.mockImplementationOnce(
				() =>
					new Promise<undefined>((resolve) => {
						resolveRequest = () => resolve(undefined);
					}),
			);
			const store = useCallsStore();

			const firstAttempt = store.call('100');
			await vi.waitFor(() => expect(clientCall).toHaveBeenCalled());
			await store.call('100');
			resolveRequest();
			await firstAttempt;

			expect(clientCall).toHaveBeenCalledTimes(1);
			expect(store.isDialing).toBe(false);
		});

		it('holds the call the agent is talking on before dialling', async () => {
			const activeCall = buildCall({
				active: true,
			});
			calls.value = [
				activeCall,
			];
			const store = useCallsStore();

			await store.call('100');

			expect(activeCall.hold).toHaveBeenCalledTimes(1);
			expect(clientCall).toHaveBeenCalled();
		});

		it('leaves an already held call alone', async () => {
			const heldCall = buildCall({
				active: true,
				isHold: true,
			});
			calls.value = [
				heldCall,
			];
			const store = useCallsStore();

			await store.call('100');

			expect(heldCall.hold).not.toHaveBeenCalled();
		});

		it('refuses to dial when the microphone is blocked', async () => {
			isMicrophoneAllowed.mockResolvedValue(false);
			const store = useCallsStore();

			await store.call('100');

			expect(clientCall).not.toHaveBeenCalled();
			expect(mockEmit).toHaveBeenCalledWith(
				'notification',
				expect.objectContaining({
					type: 'error',
				}),
			);
		});

		it('tells the agent when the platform rejects the call', async () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			clientCall.mockRejectedValueOnce(new Error('rejected'));
			const store = useCallsStore();

			await expect(store.call('100')).resolves.toBe(false);

			expect(mockEmit).toHaveBeenCalledWith('notification', {
				type: 'error',
				text: 'error.calls.outboundCallFailed',
			});
			expect(store.isDialing).toBe(false);
		});
	});

	describe('toggleMute', () => {
		it('mutes an unmuted call', async () => {
			const call = buildCall({
				muted: false,
				mute: vi.fn(),
			} as Partial<Call>);
			calls.value = [
				call,
			];
			const store = useCallsStore();

			await store.toggleMute('call-1');

			expect(call.mute).toHaveBeenCalledWith(true);
		});

		it('unmutes a muted call', async () => {
			const call = buildCall({
				muted: true,
				mute: vi.fn(),
			} as Partial<Call>);
			calls.value = [
				call,
			];
			const store = useCallsStore();

			await store.toggleMute('call-1');

			expect(call.mute).toHaveBeenCalledWith(false);
		});

		it('leaves a call that already ended alone', async () => {
			const call = buildCall({
				allowHangup: false,
				mute: vi.fn(),
			} as Partial<Call>);
			calls.value = [
				call,
			];
			const store = useCallsStore();

			await store.toggleMute('call-1');

			expect(call.mute).not.toHaveBeenCalled();
		});
	});

	describe('call audio', () => {
		it('plays the remote party once its stream arrives', () => {
			const store = useCallsStore();
			store.initialize();
			const call = buildCall();

			getCallEventHandler()(CallActions.PeerStream, call);

			expect(playRemoteAudio).toHaveBeenCalledWith(call);
		});

		it.each([
			CallActions.Hangup,
			CallActions.Destroy,
		])('stops the remote audio on %s', (action) => {
			const store = useCallsStore();
			store.initialize();

			getCallEventHandler()(action, buildCall());

			expect(stopRemoteAudio).toHaveBeenCalledWith('call-1');
		});
	});
});
