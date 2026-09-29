import { createTableStore } from '@webitel/ui-datalist';

import { callsHistoryApiModule } from './_internals/callsHistoryApiModule';
import { headers } from './_internals/headers';

export const useCallsHistoryDataListStore = createTableStore(
	'ui/history/calls/datalist',
	{
		apiModule: callsHistoryApiModule,
		headers,
		isAppendDataList: true,
	},
);
