import { createTableStore } from '@webitel/ui-datalist';

import { callsHistoryApiModule } from '../../../../../../../features/calls/api/callsHistoryApiModule';
import { useUserinfoStore } from '../../../../../../../features/userinfo/stores/userinfoStore';
import { headers } from './_internals/headers';

export const useMissedCallsDataListStore = createTableStore(
	'ui/calls/missed/datalist',
	{
		apiModule: {
			getList: (params: Record<string, unknown> = {}) =>
				callsHistoryApiModule.getList({
					...params,
					ownerId: useUserinfoStore().userId,
					missed: true,
				}),
		},
		headers,
		isAppendDataList: true,
	},
);
