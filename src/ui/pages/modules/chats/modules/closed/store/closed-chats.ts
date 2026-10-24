import { createTableStore } from '@webitel/ui-datalist';

import { useChatsStore } from '../../../../../../../features/chats/store/chats';
import { useUserinfoStore } from '../../../../../../../features/userinfo/stores/userinfoStore';
import { closedChatsApiModule } from '../api/closedChatsApiModule';
import { headers } from './_internals/headers';

export const useClosedChatsDataListStore = createTableStore(
	'ui/chats/closed/datalist',
	{
		apiModule: {
			getList: (params: Record<string, unknown> = {}) =>
				closedChatsApiModule.getList({
					...params,
					userId: useUserinfoStore().userId,
					taskThreadIds: useChatsStore().taskThreadIds,
				}),
		},
		headers,
		isAppendDataList: true,
	},
);
