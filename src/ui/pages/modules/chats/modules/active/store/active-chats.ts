import { createTableStore } from '@webitel/ui-datalist';

import { useUserinfoStore } from '../../../../../../../features/userinfo/stores/userinfoStore';
import { activeChatsApiModule } from '../api/activeChatsApiModule';
import { headers } from './_internals/headers';

export const useActiveChatsDataListStore = createTableStore(
	'ui/chats/active/datalist',
	{
		apiModule: {
			getList: (params: Record<string, unknown> = {}) =>
				activeChatsApiModule.getList({
					...params,
					userId: useUserinfoStore().userId,
				}),
		},
		headers,
		isAppendDataList: true,
	},
);
