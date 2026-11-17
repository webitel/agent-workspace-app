import type { Task } from 'webitel-sdk';

import {
	type OfferCardContent,
	OfferKind,
} from '../../../ui/notifications/modules/offers/types/Offer.types';

type ChatChannel = {
	name?: string;
	type?: string;
};

type ChatDistribute = {
	communication?: {
		thread?: {
			channel?: ChatChannel;
		};
	};
};

/**
 * Maps an SDK chat `Task` onto the channel-neutral offer card content contract, so the
 * notifications module stays free of `webitel-sdk`.
 */

/**
 * `distribute.member_name` — the name pushed from the schema or member. Null
 * when the platform has nothing, which is the "contact not identified" case
 * (AC_06.01.01). Full contact identification is E7's job, not this story's.
 */
function resolveName(task: Task): string | undefined {
	return task.displayName || undefined;
}

/**
 * The call-center payload adds the gateway to the raw distribute event. The
 * current SDK keeps that event on the task but has not exposed its channel in
 * the public Task thread type yet.
 */
function resolveSource(task: Task): OfferCardContent['source'] {
	const distribute = (
		task as unknown as {
			distribute?: ChatDistribute;
		}
	).distribute;
	const channel = distribute?.communication?.thread?.channel;

	return channel?.name
		? {
				label: 'Channel',
				value: channel.name,
			}
		: undefined;
}

export function toChatOfferContent(task: Task): OfferCardContent {
	return {
		kind: OfferKind.Chat,
		name: resolveName(task),
		// the client's username, from `communication.destination`
		identifier: task.displayNumber || undefined,
		source: resolveSource(task),
		queueName: task.queue?.name || undefined,
		// no `variables` until US_06.02 (WS-66) settles which ones reach the card
		body: task.thread?.lastMsg,
		waitingSince: task.offeringAt || undefined,
		maxWaitSec: task.acceptTimeoutSec || undefined,
		isCountdown: true,
	};
}
