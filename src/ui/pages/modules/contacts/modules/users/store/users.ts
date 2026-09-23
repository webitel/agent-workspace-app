import { UsersAPI } from '@webitel/api-services/api';
import { createTableStore } from '@webitel/ui-datalist';

import { headers } from './_internals/headers';

export const useUsersDataListStore = createTableStore('ui/users/datalist', {
	apiModule: UsersAPI,
	headers,
	isAppendDataList: true,
});
