import type { Task } from 'webitel-sdk';

import i18n from '../../../app/locale/i18n';
import {
	type OfferCardContent,
	OfferKind,
} from '../../../ui/notifications/modules/offers/types/Offer.types';

/**
 * Maps an SDK job `Task` onto the channel-neutral offer card content contract, so the
 * notifications module stays free of `webitel-sdk`.
 */

export function toTaskOfferContent(task: Task): OfferCardContent {
	const queueName = task.queue?.name;
	const maxWaitSec = task.queueMaxWaitTime;

	return {
		kind: OfferKind.Task,
		// `distribute.member_name`; null when the platform has nothing
		name: task.displayName || undefined,
		// the member's `communication.destination`
		destination: task.displayNumber || undefined,
		source: queueName
			? {
					label: i18n.global.t('ui.notifications.offer.queue'),
					value: queueName,
				}
			: undefined,
		// the member's queue entry, unlike a call's `createdAt`
		waitingSince: task.memberJoinedAt || undefined,
		maxWaitSec: maxWaitSec && maxWaitSec > 0 ? maxWaitSec : undefined,
	};
}
