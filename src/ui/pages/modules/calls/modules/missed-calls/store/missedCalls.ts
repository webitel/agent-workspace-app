import { createTableStore } from '@webitel/ui-datalist';
import { getMissedCalls } from '../api/missedCallsAPI';
import { headers } from './_internals/headers';

export const useMissedCallsStore = createTableStore(
	'ui/calls/missed-calls/datalist',
	{
		apiModule: {
			getList: getMissedCalls,
		},
		headers,
		isAppendDataList: true,
	},
);
