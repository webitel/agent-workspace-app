import type { Call } from 'webitel-sdk';

import type { OutboundCallPreview } from '../../../ui/call/types/OutboundCallPreview.types';
import type { OutboundCallStatus } from '../enums/OutboundCallStatus.enum';
import type { DialedCallIds } from './DialedCallIds.types';

/**
 * One manual dial, from the request until the callee answers or the agent
 * closes it. `placedCall` stays `null` until the platform reports the call.
 */
export interface OutboundCallAttempt {
	id: string;
	destination: string;
	placedCall: Call | null;
	callIdsBeforeDial: ReadonlySet<string>;
	/**
	 * @author Oleksandr Palonnyi
	 * Empty until `callsStore.call` resolves, and for good when the dial returns no ids
	 * [WS-155](https://webitel.atlassian.net/browse/WS-155) [NWS][FE] Відкривати плажку активного дзвінка в розгорнутому стані після прийняття вихідного дзвінка
	 */
	dialedCallIds: DialedCallIds;
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

/**
 * @author Oleksandr Palonnyi
 * `call: null` takes a call away from the attempt: its ids name another call, or an
 * attempt whose ids name this one claimed it. The attempt is back to Dialing
 * [WS-155](https://webitel.atlassian.net/browse/WS-155) [NWS][FE] Відкривати плажку активного дзвінка в розгорнутому стані після прийняття вихідного дзвінка
 */
export interface OutboundCallAssignment {
	attemptId: string;
	call: Call | null;
}
