import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { type Call, CallDirection } from 'webitel-sdk';

import { mockEmit } from '../../../../../test/setup';
import { useCallTransfersStore } from '../callTransfers';

// replaced per test, as in the calls store suite: the store under test only
// reads a call from the calls store, so that store is stood in for
let calls = ref<Call[]>([]);

vi.mock('../calls', () => ({
	useCallsStore: () => ({
		getCallById: (callId: string) =>
			calls.value.find((call) => call.id === callId),
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
		isHold: false,
		hold: vi.fn(),
		...overrides,
	}) as unknown as Call;

describe('useCallTransfersStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		calls = ref([]);
		mockEmit.mockClear();
		localStorage.clear();
	});

	describe('blindTransfer', () => {
		const buildTransferableCall = (overrides: Partial<Call> = {}): Call =>
			buildCall({
				answeredAt: 1_700_000_000_000,
				hangupAt: 0,
				allowTransfer: true,
				blindTransfer: vi.fn().mockResolvedValue({}),
				...overrides,
			} as Partial<Call>);

		it('transfers the call to the destination and reports success', async () => {
			const call = buildTransferableCall();
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.blindTransfer('call-1', '1001')).toBe(true);
			expect(call.blindTransfer).toHaveBeenCalledWith('1001');
			expect(mockEmit).not.toHaveBeenCalled();
		});

		it('notifies and reports failure when the backend refuses', async () => {
			calls.value = [
				buildTransferableCall({
					blindTransfer: vi.fn().mockRejectedValue(new Error('boom')),
				} as Partial<Call>),
			];
			const store = useCallTransfersStore();

			expect(await store.blindTransfer('call-1', '1001')).toBe(false);
			expect(mockEmit).toHaveBeenCalledWith('notification', {
				type: 'error',
				text: 'error.calls.transferFailed',
			});
		});

		it('does nothing for a call that cannot be transferred', async () => {
			const call = buildTransferableCall({
				allowTransfer: false,
			});
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.blindTransfer('call-1', '1001')).toBe(false);
			expect(call.blindTransfer).not.toHaveBeenCalled();
		});

		it('does nothing for an unknown call', async () => {
			const store = useCallTransfersStore();

			expect(await store.blindTransfer('missing', '1001')).toBe(false);
		});
	});

	describe('consultTransferToAgent', () => {
		const buildConsultableCall = (overrides: Partial<Call> = {}): Call =>
			buildCall({
				answeredAt: 1_700_000_000_000,
				hangupAt: 0,
				allowTransfer: true,
				isHold: false,
				hold: vi.fn().mockResolvedValue({}),
				processTransferAgent: vi.fn().mockResolvedValue({}),
				...overrides,
			} as Partial<Call>);

		it('holds the call, then consults the agent and reports success', async () => {
			const call = buildConsultableCall();
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.consultTransferToAgent('call-1', '42')).toBe(true);
			expect(call.hold).toHaveBeenCalledTimes(1);
			expect(call.processTransferAgent).toHaveBeenCalledWith(42, {
				disableStun: false,
			});
			expect(vi.mocked(call.hold).mock.invocationCallOrder[0]).toBeLessThan(
				vi.mocked(call.processTransferAgent).mock.invocationCallOrder[0],
			);
			expect(mockEmit).not.toHaveBeenCalled();
		});

		it('does not hold a call that is already on hold', async () => {
			const call = buildConsultableCall({
				isHold: true,
			});
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.consultTransferToAgent('call-1', '42')).toBe(true);
			expect(call.hold).not.toHaveBeenCalled();
		});

		it('does not place the consult when the call cannot be held', async () => {
			const call = buildConsultableCall({
				hold: vi.fn().mockRejectedValue(new Error('boom')),
			} as Partial<Call>);
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.consultTransferToAgent('call-1', '42')).toBe(false);
			expect(call.processTransferAgent).not.toHaveBeenCalled();
			expect(mockEmit).toHaveBeenCalledWith('notification', {
				type: 'error',
				text: 'error.calls.holdToggleFailed',
			});
		});

		it('notifies and reports failure when the backend refuses the consult', async () => {
			calls.value = [
				buildConsultableCall({
					processTransferAgent: vi.fn().mockRejectedValue(new Error('boom')),
				} as Partial<Call>),
			];
			const store = useCallTransfersStore();

			expect(await store.consultTransferToAgent('call-1', '42')).toBe(false);
			expect(mockEmit).toHaveBeenCalledWith('notification', {
				type: 'error',
				text: 'error.calls.transferFailed',
			});
		});

		it('does nothing for a call that cannot be transferred', async () => {
			const call = buildConsultableCall({
				allowTransfer: false,
			});
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.consultTransferToAgent('call-1', '42')).toBe(false);
			expect(call.hold).not.toHaveBeenCalled();
			expect(call.processTransferAgent).not.toHaveBeenCalled();
		});

		it('does nothing for an agent id that is not a number', async () => {
			const call = buildConsultableCall();
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.consultTransferToAgent('call-1', 'abc')).toBe(false);
			expect(call.hold).not.toHaveBeenCalled();
		});

		it('does nothing for an unknown call', async () => {
			const store = useCallTransfersStore();

			expect(await store.consultTransferToAgent('missing', '42')).toBe(false);
		});
	});

	describe('blindTransferToQueue', () => {
		const buildTransferableCall = (overrides: Partial<Call> = {}): Call =>
			buildCall({
				answeredAt: 1_700_000_000_000,
				hangupAt: 0,
				allowTransfer: true,
				blindTransferQueue: vi.fn().mockResolvedValue({}),
				...overrides,
			} as Partial<Call>);

		it('transfers the call to the queue and reports success', async () => {
			const call = buildTransferableCall();
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.blindTransferToQueue('call-1', '7')).toBe(true);
			expect(call.blindTransferQueue).toHaveBeenCalledWith(7);
			expect(mockEmit).not.toHaveBeenCalled();
		});

		it('notifies and reports failure when the backend refuses', async () => {
			calls.value = [
				buildTransferableCall({
					blindTransferQueue: vi.fn().mockRejectedValue(new Error('boom')),
				} as Partial<Call>),
			];
			const store = useCallTransfersStore();

			expect(await store.blindTransferToQueue('call-1', '7')).toBe(false);
			expect(mockEmit).toHaveBeenCalledWith('notification', {
				type: 'error',
				text: 'error.calls.transferFailed',
			});
		});

		it('does nothing for a call that cannot be transferred', async () => {
			const call = buildTransferableCall({
				allowTransfer: false,
			});
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.blindTransferToQueue('call-1', '7')).toBe(false);
			expect(call.blindTransferQueue).not.toHaveBeenCalled();
		});

		it('does nothing for an empty or non-positive queue id', async () => {
			const call = buildTransferableCall();
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.blindTransferToQueue('call-1', '')).toBe(false);
			expect(await store.blindTransferToQueue('call-1', '0')).toBe(false);
			expect(await store.blindTransferToQueue('call-1', '-3')).toBe(false);
			expect(call.blindTransferQueue).not.toHaveBeenCalled();
		});

		it('does nothing for a queue id that is not a number', async () => {
			const call = buildTransferableCall();
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.blindTransferToQueue('call-1', 'abc')).toBe(false);
			expect(call.blindTransferQueue).not.toHaveBeenCalled();
		});

		it('does nothing for an unknown call', async () => {
			const store = useCallTransfersStore();

			expect(await store.blindTransferToQueue('missing', '7')).toBe(false);
		});
	});

	describe('consultTransferToQueue', () => {
		const buildConsultableCall = (overrides: Partial<Call> = {}): Call =>
			buildCall({
				answeredAt: 1_700_000_000_000,
				hangupAt: 0,
				allowTransfer: true,
				isHold: false,
				hold: vi.fn().mockResolvedValue({}),
				processTransferQueue: vi.fn().mockResolvedValue({}),
				...overrides,
			} as Partial<Call>);

		it('holds the call, then consults the queue and reports success', async () => {
			const call = buildConsultableCall();
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.consultTransferToQueue('call-1', '7')).toBe(true);
			expect(call.hold).toHaveBeenCalledTimes(1);
			expect(call.processTransferQueue).toHaveBeenCalledWith(7, {
				disableStun: false,
			});
			expect(vi.mocked(call.hold).mock.invocationCallOrder[0]).toBeLessThan(
				vi.mocked(call.processTransferQueue).mock.invocationCallOrder[0],
			);
			expect(mockEmit).not.toHaveBeenCalled();
		});

		it('does not hold a call that is already on hold', async () => {
			const call = buildConsultableCall({
				isHold: true,
			});
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.consultTransferToQueue('call-1', '7')).toBe(true);
			expect(call.hold).not.toHaveBeenCalled();
		});

		it('does not place the consult when the call cannot be held', async () => {
			const call = buildConsultableCall({
				hold: vi.fn().mockRejectedValue(new Error('boom')),
			} as Partial<Call>);
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.consultTransferToQueue('call-1', '7')).toBe(false);
			expect(call.processTransferQueue).not.toHaveBeenCalled();
			expect(mockEmit).toHaveBeenCalledWith('notification', {
				type: 'error',
				text: 'error.calls.holdToggleFailed',
			});
		});

		it('notifies and reports failure when the backend refuses the consult', async () => {
			calls.value = [
				buildConsultableCall({
					processTransferQueue: vi.fn().mockRejectedValue(new Error('boom')),
				} as Partial<Call>),
			];
			const store = useCallTransfersStore();

			expect(await store.consultTransferToQueue('call-1', '7')).toBe(false);
			expect(mockEmit).toHaveBeenCalledWith('notification', {
				type: 'error',
				text: 'error.calls.transferFailed',
			});
		});

		it('does nothing for a call that cannot be transferred', async () => {
			const call = buildConsultableCall({
				allowTransfer: false,
			});
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.consultTransferToQueue('call-1', '7')).toBe(false);
			expect(call.hold).not.toHaveBeenCalled();
			expect(call.processTransferQueue).not.toHaveBeenCalled();
		});

		it('does nothing for an empty or non-positive queue id', async () => {
			const call = buildConsultableCall();
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.consultTransferToQueue('call-1', '')).toBe(false);
			expect(await store.consultTransferToQueue('call-1', '0')).toBe(false);
			expect(await store.consultTransferToQueue('call-1', '-3')).toBe(false);
			expect(call.hold).not.toHaveBeenCalled();
		});

		it('does nothing for a queue id that is not a number', async () => {
			const call = buildConsultableCall();
			calls.value = [
				call,
			];
			const store = useCallTransfersStore();

			expect(await store.consultTransferToQueue('call-1', 'abc')).toBe(false);
			expect(call.hold).not.toHaveBeenCalled();
		});

		it('does nothing for an unknown call', async () => {
			const store = useCallTransfersStore();

			expect(await store.consultTransferToQueue('missing', '7')).toBe(false);
		});
	});
});
