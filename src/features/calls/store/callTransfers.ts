import { acceptHMRUpdate, defineStore } from 'pinia';
import type { Call } from 'webitel-sdk';

import { canTransferCall } from '../scripts/canTransferCall';
import { getStunEnabled } from '../scripts/getStunEnabled';
import { notifyCallError } from '../scripts/notifyCallError';
import { toPositiveNumericId } from '../scripts/toPositiveNumericId';
import { useCallsStore } from './calls';

/**
 * @author Oleksandr Palonnyi
 * Blind and consult transfers of an Active call, split out of the calls store
 * to keep it to the call feed. It stores nothing: the call is read from the
 * calls store on every request, and a Consult call comes back through the
 * call feed as a call of its own (ADR-0017)
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const useCallTransfersStore = defineStore('calls/transfers', () => {
	const callsStore = useCallsStore();

	/**
	 * @author Oleksandr Palonnyi
	 * a failure is reported here, not thrown, so the popup that asked can stay
	 * open with the number the agent typed
	 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
	 */
	async function sendTransferRequest(
		request: () => Promise<unknown>,
	): Promise<boolean> {
		try {
			await request();
			return true;
		} catch {
			notifyCallError('transferFailed');
			return false;
		}
	}

	/**
	 * @author Oleksandr Palonnyi
	 * the original call goes on hold first, as in cc-workspaces, so the client
	 * does not hear the agent talk to the destination. If it cannot be held the
	 * consult is not placed
	 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
	 */
	async function holdCallBeforeConsult(call: Call): Promise<boolean> {
		try {
			if (!call.isHold) await call.hold();
			return true;
		} catch (err) {
			console.warn('[calls] holding the call before a consult failed', err);
			notifyCallError('holdToggleFailed');
			return false;
		}
	}

	/**
	 * @author Oleksandr Palonnyi
	 * resolves true once the backend accepted the transfer, which is not yet
	 * the end of the call: the SDK drops it from the list afterwards, and that
	 * is what closes its window
	 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
	 */
	async function blindTransfer(
		callId: string,
		destination: string,
	): Promise<boolean> {
		const call = callsStore.getCallById(callId);
		if (!canTransferCall(call)) return false;

		return sendTransferRequest(() => call.blindTransfer(destination));
	}

	/**
	 * @author Oleksandr Palonnyi
	 * a refused consult leaves the original on hold: the agent resumes it by
	 * hand. The Consult call arrives through the call feed as a call of its own,
	 * nothing is stored here
	 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
	 */
	async function consultTransferToAgent(
		callId: string,
		agentId: string,
	): Promise<boolean> {
		const call = callsStore.getCallById(callId);
		const agentNumericId = toPositiveNumericId(agentId);
		if (!canTransferCall(call) || agentNumericId === null) return false;

		if (!(await holdCallBeforeConsult(call))) return false;

		return sendTransferRequest(() =>
			call.processTransferAgent(agentNumericId, {
				disableStun: !getStunEnabled(),
			}),
		);
	}

	/**
	 * @author Oleksandr Palonnyi
	 * resolves true once the backend accepted the transfer; like a blind transfer
	 * to a number, the call leaving the list is what closes its window
	 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
	 */
	async function blindTransferToQueue(
		callId: string,
		queueId: string,
	): Promise<boolean> {
		const call = callsStore.getCallById(callId);
		const queueNumericId = toPositiveNumericId(queueId);
		if (!canTransferCall(call) || queueNumericId === null) return false;

		return sendTransferRequest(() => call.blindTransferQueue(queueNumericId));
	}

	/**
	 * @author Oleksandr Palonnyi
	 * holds the original first, the same as the consult to an agent: US_13.07's
	 * source page says the client is put on hold, and the SDK's
	 * `processTransferQueue` only sends `call_to_queue` without holding.
	 * cc-workspaces did not hold here, only for an agent, which looks like an
	 * omission
	 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
	 */
	async function consultTransferToQueue(
		callId: string,
		queueId: string,
	): Promise<boolean> {
		const call = callsStore.getCallById(callId);
		const queueNumericId = toPositiveNumericId(queueId);
		if (!canTransferCall(call) || queueNumericId === null) return false;

		if (!(await holdCallBeforeConsult(call))) return false;

		return sendTransferRequest(() =>
			call.processTransferQueue(queueNumericId, {
				disableStun: !getStunEnabled(),
			}),
		);
	}

	return {
		blindTransfer,
		consultTransferToAgent,
		blindTransferToQueue,
		consultTransferToQueue,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(
		acceptHMRUpdate(useCallTransfersStore, import.meta.hot),
	);
}
