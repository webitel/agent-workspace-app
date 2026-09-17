import type { Call } from 'webitel-sdk';

import i18n from '../../../app/locale/i18n';
import {
	type IncomingInteractionPreview,
	InteractionKind,
} from '../../../ui/notifications/types/IncomingInteraction.types';

/**
 * Maps an SDK `Call` onto the channel-neutral preview contract. Everything the
 * spec calls "наявна логіка" resolves here so the notifications module stays
 * free of `webitel-sdk`.
 */

const MASK = '*****';
const VISIBLE_TAIL = 3;

/**
 * Masked numbers render as `*****678` — a constant-width token, deliberately not
 * length-preserving, so the original number's length isn't leaked.
 */
export function maskNumber(number?: string): string | undefined {
	if (!number) return undefined;
	if (number.length <= VISIBLE_TAIL) return MASK;
	return `${MASK}${number.slice(-VISIBLE_TAIL)}`;
}

/**
 * `Call.displayName` is `''` when the platform has nothing better than the
 * number itself, which is exactly the "contact not identified" case. `hideContact`
 * is a separate backend flag the spec doesn't mention; we fail closed on it.
 */
function resolveName(call: Call): string | undefined {
	if (call.hideContact) return undefined;
	return call.displayName || undefined;
}

/**
 * Not on `QueueParameters` yet — WS-16 is expected to add it. Read defensively so
 * the progress bar starts working the moment the field appears on the wire.
 */
function resolveMaxWaitSec(call: Call): number | undefined {
	const queue = call.queue as
		| (typeof call.queue & {
				max_wait_time?: number;
		  })
		| null;
	const maxWaitTime = queue?.max_wait_time;
	return typeof maxWaitTime === 'number' && maxWaitTime > 0
		? maxWaitTime
		: undefined;
}

export function toIncomingCallPreview(call: Call): IncomingInteractionPreview {
	const number = call.displayNumber;

	return {
		kind: InteractionKind.Call,
		name: resolveName(call),
		identifier: call.hideNumber ? maskNumber(number) : number,
		source: call.queue?.queue_name
			? {
					label: i18n.global.t('ui.notifications.incoming.queue'),
					value: call.queue.queue_name,
				}
			: undefined,
		// `createdAt` is the only wait epoch the SDK surfaces; it undercounts the
		// real queue wait (WS-16 should expose the queue-join time).
		waitingSince: call.createdAt,
		maxWaitSec: resolveMaxWaitSec(call),
	};
}
