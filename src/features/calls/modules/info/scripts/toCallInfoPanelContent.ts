import { type Call, CallDirection } from 'webitel-sdk';

import { maskNumber } from '../../../scripts/toCallOfferContent';
import type { CallInfoPanelContent } from '../types/CallInfoPanelContent.types';

const callDirections: readonly string[] = Object.values(CallDirection);

function isCallDirection(value: string): value is CallDirection {
	return callDirections.includes(value);
}

// `hideNumber` withholds the client's number: the caller on an inbound call,
// the callee on an outbound one. Our own side is always shown.
function resolveNumber(call: Call, side: 'from' | 'to'): string | undefined {
	const number = call[side]?.number || undefined;
	const clientSide = call.direction === CallDirection.Outbound ? 'to' : 'from';
	return call.hideNumber && side === clientSide ? maskNumber(number) : number;
}

export function toCallInfoPanelContent(call: Call): CallInfoPanelContent {
	return {
		direction: isCallDirection(call.direction) ? call.direction : undefined,
		from: resolveNumber(call, 'from'),
		to: resolveNumber(call, 'to'),
		queueName: call.queue?.queue_name || undefined,
		createdAt: call.createdAt || undefined,
		answeredAt: call.answeredAt || undefined,
	};
}
