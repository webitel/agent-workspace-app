import type { Call } from 'webitel-sdk';

import { OutboundCallStatus } from '../enums/OutboundCallStatus.enum';

export function getOutboundCallStatus(
	call: Call | null | undefined,
): OutboundCallStatus {
	if (!call) return OutboundCallStatus.Dialing;
	if (call.answeredAt > 0) return OutboundCallStatus.Answered;
	if (call.hangupAt > 0) return OutboundCallStatus.NoAnswer;
	return OutboundCallStatus.Ringing;
}
