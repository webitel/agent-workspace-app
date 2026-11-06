import { createTableStore } from '@webitel/ui-datalist';

import { selfAssignedCallsApiModule } from '../api/selfAssignedCallsApiModule';
import { headers } from './_internals/headers';

export const useSelfAssignedCallsDataListStore = createTableStore(
	'ui/calls/self-assigned/datalist',
	{
		apiModule: selfAssignedCallsApiModule,
		headers,
		isAppendDataList: true,
	},
);
