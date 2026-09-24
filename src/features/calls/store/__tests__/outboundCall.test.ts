import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';
import { type Call, CallDirection } from 'webitel-sdk';

import { OutboundCallStatus } from '../../enums/OutboundCallStatus.enum';
import { useOutboundCallStore } from '../outboundCall';

/**
 * @author Oleksandr Palonnyi
 * The calls store is replaced by its public surface: dialling and hanging up
 * are covered by its own suite, here only the attempt's bookkeeping matters.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
const callsStore = reactive({
	callList: [] as Call[],
	isDialing: false,
	call: vi.fn(async (_destination: string) => true),
	hangup: vi.fn(async (_callId: string) => undefined),
	toggleMute: vi.fn(async (_callId: string) => undefined),
});

vi.mock('../calls', () => ({
	useCallsStore: () => callsStore,
}));

/**
 * @author Oleksandr Palonnyi
 * Reactive like the SDK's `callStore` entries, so field changes reach the
 * derived status the same way they do in the app.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
const buildCall = (overrides: Partial<Call> = {}): Call =>
	reactive({
		id: 'outbound-1',
		direction: CallDirection.Outbound,
		answeredAt: 0,
		hangupAt: 0,
		...overrides,
	}) as unknown as Call;

function setup() {
	const store = useOutboundCallStore();
	store.initialize();
	return store;
}

async function ring(call: Call) {
	callsStore.callList = [
		...callsStore.callList,
		call,
	];
	await nextTick();
}

describe('useOutboundCallStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		callsStore.callList = [];
		callsStore.isDialing = false;
		callsStore.call.mockReset();
		callsStore.call.mockResolvedValue(true);
		callsStore.hangup.mockClear();
		callsStore.toggleMute.mockClear();
	});

	it('has no attempt by default', () => {
		const store = setup();

		expect(store.status).toBeNull();
	});

	it('is dialing until the platform reports the call', async () => {
		const store = setup();

		await store.dial('100');

		expect(callsStore.call).toHaveBeenCalledWith('100');
		expect(store.status).toBe(OutboundCallStatus.Dialing);
	});

	it('follows the outbound call that appears after dialling', async () => {
		const store = setup();
		await store.dial('100');

		const call = buildCall();
		await ring(call);

		expect(store.placedCall).toStrictEqual(call);
		expect(store.status).toBe(OutboundCallStatus.Ringing);
	});

	it('ignores calls that existed before dialling and inbound calls', async () => {
		callsStore.callList = [
			buildCall({
				id: 'already-there',
			}),
		];
		const store = setup();
		await store.dial('100');

		await ring(
			buildCall({
				id: 'inbound',
				direction: CallDirection.Inbound,
			}),
		);

		expect(store.placedCall).toBeNull();
	});

	it('follows the call even when it rings before the request resolves', async () => {
		let resolveRequest: (isPlaced: boolean) => void = () => {};
		callsStore.call.mockImplementationOnce(
			() =>
				new Promise<boolean>((resolve) => {
					resolveRequest = resolve;
				}),
		);
		const store = setup();

		const dialling = store.dial('100');
		await ring(buildCall());
		resolveRequest(true);
		await dialling;

		expect(store.status).toBe(OutboundCallStatus.Ringing);
	});

	it('drops the attempt when the call could not be placed', async () => {
		callsStore.call.mockResolvedValue(false);
		const store = setup();

		await store.dial('100');

		expect(store.status).toBeNull();
	});

	it('ignores dialling while another request is in flight', async () => {
		callsStore.isDialing = true;
		const store = setup();

		await store.dial('100');

		expect(callsStore.call).not.toHaveBeenCalled();
		expect(store.status).toBeNull();
	});

	it('is answered once the callee picks up', async () => {
		const store = setup();
		await store.dial('100');
		const call = buildCall();
		await ring(call);

		call.answeredAt = 1000;
		await nextTick();

		expect(store.status).toBe(OutboundCallStatus.Answered);
	});

	it('closes the attempt when an answered call ends', async () => {
		const store = setup();
		await store.dial('100');
		const call = buildCall();
		await ring(call);

		call.answeredAt = 1000;
		call.hangupAt = 2000;
		await nextTick();

		expect(store.status).toBeNull();
	});

	/**
	 * @author Oleksandr Palonnyi
	 * The SDK drops the call on `Destroy`; No answer must survive that.
	 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
	 */
	it('keeps no answer after the call leaves the call list', async () => {
		const store = setup();
		await store.dial('100');
		const call = buildCall();
		await ring(call);

		call.hangupAt = 2000;
		callsStore.callList = [];
		await nextTick();

		expect(store.status).toBe(OutboundCallStatus.NoAnswer);
		expect(store.destination).toBe('100');
	});

	it('retries the same number after no answer', async () => {
		const store = setup();
		await store.dial('100');
		const call = buildCall();
		await ring(call);
		call.hangupAt = 2000;
		await nextTick();

		await store.retry();

		expect(callsStore.call).toHaveBeenLastCalledWith('100');
		expect(store.status).toBe(OutboundCallStatus.Dialing);
	});

	it('does not retry a call that is still ringing', async () => {
		const store = setup();
		await store.dial('100');
		await ring(buildCall());

		await store.retry();

		expect(callsStore.call).toHaveBeenCalledTimes(1);
	});

	it('hangs up the ringing call and closes the attempt', async () => {
		const store = setup();
		await store.dial('100');
		await ring(buildCall());

		await store.hangup();

		expect(callsStore.hangup).toHaveBeenCalledWith('outbound-1');
		expect(store.status).toBeNull();
	});

	it('closes at once when hung up before the call rang', async () => {
		const store = setup();
		await store.dial('100');

		await store.hangup();

		expect(store.status).toBeNull();
	});

	it('hangs up the call that rings after an early hangup instead of following it', async () => {
		const store = setup();
		await store.dial('100');
		await store.hangup();

		await ring(buildCall());

		expect(callsStore.hangup).toHaveBeenCalledWith('outbound-1');
		expect(store.placedCall).toBeNull();
		expect(store.status).toBeNull();
	});

	it('previews the typed number until the call rings', async () => {
		const store = setup();

		await store.dial('+1 202 341 7842');

		expect(store.preview).toEqual({
			name: undefined,
			number: '+1 202 341 7842',
		});
	});

	it('previews what the platform resolved once the call rings', async () => {
		const store = setup();
		await store.dial('+1 202 341 7842');

		await ring(
			buildCall({
				displayName: 'Emily Johnson',
				displayNumber: '+12023417842',
			}),
		);

		expect(store.preview).toEqual({
			name: 'Emily Johnson',
			number: '+12023417842',
		});
	});

	it('toggles the microphone of the placed call', async () => {
		const store = setup();
		await store.dial('100');
		await ring(buildCall());

		await store.toggleMute();

		expect(callsStore.toggleMute).toHaveBeenCalledWith('outbound-1');
	});

	it('has nothing to mute before the call rings', async () => {
		const store = setup();
		await store.dial('100');

		await store.toggleMute();

		expect(callsStore.toggleMute).not.toHaveBeenCalled();
		expect(store.isMuted).toBe(false);
	});

	it('closes the attempt on dismiss', async () => {
		const store = setup();
		await store.dial('100');
		const call = buildCall();
		await ring(call);
		call.hangupAt = 2000;
		await nextTick();

		store.dismiss();

		expect(store.status).toBeNull();
		expect(store.destination).toBeNull();
	});
});
