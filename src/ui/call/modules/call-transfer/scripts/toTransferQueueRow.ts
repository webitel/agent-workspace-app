import type {
	TransferQueueRow,
	TransferQueueSource,
} from '../types/CallTransfer.types';

export function toTransferQueueRow(
	queue: TransferQueueSource,
): TransferQueueRow {
	return {
		id: queue.id,
		name: queue.name ?? '',
		description: queue.description ?? '',
	};
}
