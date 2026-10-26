import { createTableStore } from '@webitel/ui-datalist';

import { useChatsStore } from '../../../../../../../features/chats/store/chats';
import { closedChatsApiModule } from '../api/closedChatsApiModule';
import { headers } from './_internals/headers';

export const useClosedChatsDataListStore = createTableStore(
	'ui/chats/closed/datalist',
	{
		apiModule: {
			getList: (params: Record<string, unknown> = {}) =>
				closedChatsApiModule.getList({
					...params,
					taskThreadIds: useChatsStore().taskThreadIds,
				}),
		},
		headers,
		isAppendDataList: true,
	},
);
