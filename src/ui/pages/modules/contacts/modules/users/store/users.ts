import { UsersAPI } from '@webitel/api-services/api';
import { createTableStore } from '@webitel/ui-datalist';

import { headers } from './_internals/headers';

export const useUsersDataListStore = createTableStore('ui/users/datalist', {
	apiModule: {
		// `contact` has no column, but the sidebar needs it to open the linked contact
		getList: ({ fields = [], ...params }: { fields?: string[] } = {}) =>
			UsersAPI.getList({
				...params,
				fields: [
					...fields,
					'contact',
				],
			}),
	},
	headers,
	isAppendDataList: true,
});
