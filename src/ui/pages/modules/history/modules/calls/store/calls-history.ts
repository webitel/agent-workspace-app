import { createTableStore } from '@webitel/ui-datalist';

import { callsHistoryApiModule } from '../../../../../../../features/calls/api/callsHistoryApiModule';
import { useUserinfoStore } from '../../../../../../../features/userinfo/stores/userinfoStore';
import { headers } from './_internals/headers';

export const useCallsHistoryDataListStore = createTableStore(
	'ui/history/calls/datalist',
	{
		apiModule: {
			getList: (params: Record<string, unknown> = {}) =>
				callsHistoryApiModule.getList({
					...params,
					ownerId: useUserinfoStore().userId,
				}),
		},
		headers,
		isAppendDataList: true,
	},
);
