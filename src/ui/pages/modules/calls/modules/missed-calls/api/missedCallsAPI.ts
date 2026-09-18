import { CallHistoryAPI } from '@webitel/api-services/api';
import { useUserinfoStore } from '../../../../../../../features/userinfo/stores/userinfoStore';
import { mapHistoryCallToRow } from '../scripts/mapHistoryCallToRow';

export const MISSED_CALLS_PAGE_SIZE = 30;

export type GetMissedCallsParams = {
	page: number;
	size?: number;
	sort?: string | null;
	search?: string;
};

// `fields` (sent by createTableStore's column projection) is intentionally
// not forwarded — history-call responses aren't projected per-column, and
// mapHistoryCallToRow needs the full record (contact/queue/destination
// fallbacks included).
export async function getMissedCalls({
	page,
	size,
	sort,
	search,
}: GetMissedCallsParams) {
	const { userId } = useUserinfoStore();

	const { items, next } = await CallHistoryAPI.getList({
		options: {},
		missed: true,
		ownerId: [
			userId,
		],
		page,
		size: size ?? MISSED_CALLS_PAGE_SIZE,
		sort,
		search,
	});

	return {
		items: (items ?? []).map(mapHistoryCallToRow),
		next,
	};
}

export async function redialMissedCall(callId: string): Promise<unknown> {
	return CallHistoryAPI.redial({
		callId,
	});
}
