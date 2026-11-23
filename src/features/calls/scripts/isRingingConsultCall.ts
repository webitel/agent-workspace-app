import { type Call, CallDirection } from 'webitel-sdk';

/**
 * @author Oleksandr Palonnyi
 * a Consult call is derived, not stored: it is the outbound call whose
 * `parentId` is the id of another call in the list. the parent has to be listed
 * so a call that merely carries a `parentId` (a leg the platform split off)
 * is not taken for one. it is ringing until the destination answers or it ends,
 * after that it is an Active call (or gone) and has no card of its own
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export function isRingingConsultCall(
	call: Call | null | undefined,
	callList: readonly Call[],
): boolean {
	if (!call?.parentId) return false;
	if (call.direction !== CallDirection.Outbound) return false;
	if (call.answeredAt > 0 || call.hangupAt > 0) return false;

	return callList.some((listedCall) => listedCall.id === call.parentId);
}
