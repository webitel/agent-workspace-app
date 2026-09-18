import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import type { MissedCallRow } from '../types/MissedCall.types';

const NO_QUEUE_PLACEHOLDER = '–';

export function mapHistoryCallToRow(call: EngineHistoryCall): MissedCallRow {
	return {
		id: call.id ?? '',
		contactId: call.contact?.id,
		name: call.contact?.name || call.destinationName || call.destination || '—',
		phoneNumber: call.destination ?? call.fromNumber ?? '—',
		createdAt: call.createdAt ?? '',
		duration: call.duration ?? 0,
		queueName: call.queue?.name || NO_QUEUE_PLACEHOLDER,
	};
}
