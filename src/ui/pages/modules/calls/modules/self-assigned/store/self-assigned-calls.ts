import { createTableStore } from '@webitel/ui-datalist';
import type { WaitingCallsSort, WaitingMemberCall } from 'webitel-sdk';

import { useWebSocketClient } from '../../../../../../../app/api/socket/composables/useWebSocketClient';
import { headers } from './_internals/headers';

// table store rows must fit ui-datalist `Identifiable`; a waiting call has no `id`
export type SelfAssignedCall = WaitingMemberCall & {
	id?: never;
};

export const useSelfAssignedCallsDataListStore = createTableStore(
	'ui/calls/self-assigned/datalist',
	{
		apiModule: {
			/**
			 * Self-assigned calls are pushed over the socket and the SDK pages,
			 * sorts and searches them itself. The SDK updates `waitingListCalls`
			 * in place, so the store gets that very array, not a copy: the table
			 * then follows socket updates. Next pages are loaded through the SDK
			 * as well, `appendToDataList` must not be used here.
			 */
			getList: async (params: Record<string, unknown> = {}) => {
				const { agent } = useWebSocketClient();

				if (!agent.value) {
					return {
						items: [],
						next: false,
					};
				}

				const { search, size, sort } = params;

				agent.value.setWaitingCallsQuery({
					q: (search as string | undefined) ?? '',
					size: size as number,
					sort: (sort as WaitingCallsSort | null | undefined) ?? null,
				});

				return {
					items: agent.value.waitingListCalls as SelfAssignedCall[],
					next: agent.value.hasMoreWaitingCalls,
				};
			},
		},
		headers,
		isAppendDataList: true,
	},
);
