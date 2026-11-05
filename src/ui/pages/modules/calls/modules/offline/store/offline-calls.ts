import { createTableStore } from '@webitel/ui-datalist';

import { offlineMembersApiModule } from '../api/offlineMembersApiModule';
import { headers } from './_internals/headers';

export const useOfflineCallsDataListStore = createTableStore(
	'ui/calls/offline/datalist',
	{
		apiModule: offlineMembersApiModule,
		headers,
		isAppendDataList: true,
	},
);
