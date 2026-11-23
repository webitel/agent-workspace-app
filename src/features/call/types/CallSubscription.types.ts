import type { Call, CallInfo } from './Call.types';

export interface CallSubscriptionStore {
	callList: { value: Call[] };
	callOnWorkspace: { value: Call | null };
	setCallList(list: Call[]): void;
	addCall(call: Call): void;
	removeCall(call: Call): void;
	updateCallInfo(payload: { callId: string; info: CallInfo }): void;
	holdOtherCalls(call: Call): void;
	setWorkspace(call: Call): void;
	resetWorkspace(): void;
	isOfflineCall: { value: boolean };
	answer(opts?: { callId?: string }): Promise<void>;
	hangup(opts?: { callId?: string }): Promise<void>;
}
