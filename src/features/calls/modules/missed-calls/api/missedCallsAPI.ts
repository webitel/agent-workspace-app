import { CallHistoryAPI } from '@webitel/api-services/api';
import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { useUserinfoStore } from '../../../../userinfo/stores/userinfoStore';

export const MISSED_CALLS_PAGE_SIZE = 30;

export type GetMissedCallsParams = {
	page: number;
	sort?: string;
	search?: string;
};

export type GetMissedCallsResult = {
	items: EngineHistoryCall[];
	next: boolean;
};

export async function getMissedCalls({
	page,
	sort,
	search,
}: GetMissedCallsParams): Promise<GetMissedCallsResult> {
	const { userId } = useUserinfoStore();

	return CallHistoryAPI.getList({
		options: {},
		missed: true,
		ownerId: [
			userId,
		],
		page,
		size: MISSED_CALLS_PAGE_SIZE,
		sort,
		search,
	});
}

export async function redialMissedCall(callId: string): Promise<unknown> {
	return CallHistoryAPI.redial({
		callId,
	});
}
