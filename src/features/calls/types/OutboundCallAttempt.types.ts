import type { Call } from 'webitel-sdk';

import type { OutboundCallPreview } from '../../../ui/dialer/types/OutboundCallPreview.types';
import type { OutboundCallStatus } from '../enums/OutboundCallStatus.enum';

/**
 * One manual dial, from the request until the callee answers or the agent
 * closes it. `placedCall` stays `null` until the platform reports the call.
 */
export interface OutboundCallAttempt {
	id: string;
	destination: string;
	placedCall: Call | null;
	callIdsBeforeDial: ReadonlySet<string>;
	isHangupRequested: boolean;
}

export interface OutboundCallAttemptView {
	id: string;
	destination: string;
	placedCall: Call | null;
	status: OutboundCallStatus;
	preview: OutboundCallPreview;
	isMuted: boolean;
}

export interface OutboundCallAssignment {
	attemptId: string;
	call: Call;
}
