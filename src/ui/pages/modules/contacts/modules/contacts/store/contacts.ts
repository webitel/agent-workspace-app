import { ContactsAPI } from '@webitel/api-services/api';
import { createTableStore } from '@webitel/ui-datalist';

import { headers } from './_internals/headers';

export const useContactsDataListStore = createTableStore(
	'ui/contacts/datalist',
	{
		apiModule: ContactsAPI,
		headers,
		isAppendDataList: true,
	},
);
