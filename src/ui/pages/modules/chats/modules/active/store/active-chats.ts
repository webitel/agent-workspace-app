import { createTableStore } from '@webitel/ui-datalist';

import { activeChatsApiModule } from '../api/activeChatsApiModule';
import { headers } from './_internals/headers';

export const useActiveChatsDataListStore = createTableStore(
	'ui/chats/active/datalist',
	{
		apiModule: activeChatsApiModule,
		headers,
		isAppendDataList: true,
	},
);
