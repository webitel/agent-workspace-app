import type { Task } from 'webitel-sdk';

import i18n from '../../../app/locale/i18n';
import {
	type OfferCardContent,
	OfferKind,
	type OfferSource,
} from '../../../ui/notifications/modules/offers/types/Offer.types';
import { formatVariableValue } from '../../variables/scripts/formatVariableValue';

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
 * The thread subject is the chat's title — the client's name as the chat
 * backend knows it — so it wins over `distribute.member_name`, which for chats
 * often repeats the username (`communication.destination`). Neither present is
 * the "contact not identified" case (AC_06.01.01). Full contact identification
 * is E7's job, not this story's.
 */
function resolveName(task: Task): string | undefined {
	return task.thread?.subject || task.displayName || undefined;
}

/**
 * The client's username, from `communication.destination`. Dropped when it
 * only repeats the name, as the SDK does for a call's number.
 */
function resolveIdentifier(task: Task): string | undefined {
	const identifier = task.displayNumber || undefined;
	return identifier === resolveName(task) ? undefined : identifier;
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
				label: i18n.global.t('ui.notifications.offer.channel'),
				value: channel.name,
			}
		: undefined;
}

/**
 * The schema's variables, in the order the task holds them; the SDK has
 * already dropped the call-center's own `cc_*` keys. Every one is shown until
 * US_06.02 (WS-66) lets Flow pick which reach the card. None is no variables
 * block at all (AC_06.01.06).
 */
function resolveVariables(task: Task): OfferSource[] | undefined {
	const variables = Object.entries(task.variables ?? {}).map(
		([key, value]) => ({
			label: key,
			value: formatVariableValue(value),
		}),
	);
	return variables.length ? variables : undefined;
}

export function toChatOfferContent(task: Task): OfferCardContent {
	return {
		kind: OfferKind.Chat,
		name: resolveName(task),
		identifier: resolveIdentifier(task),
		source: resolveSource(task),
		queueName: task.queue?.name || undefined,
		variables: resolveVariables(task),
		body: task.thread?.lastMsg,
		/**
		 * No trustworthy queue-entry epoch exists: `offeringAt` resets on every
		 * redistribution, and neither `createdAt` nor `bridgedAt` is documented as
		 * the customer's queue entry. The waiting block stays hidden until WS-35
		 * settles it.
		 */
		waitingSince: undefined,
		maxWaitSec: undefined,
	};
}
