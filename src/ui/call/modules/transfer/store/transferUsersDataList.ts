import { createTableStore } from '@webitel/ui-datalist';

import { transferUsersApiModule } from '../api/transferUsersApiModule';
import type { TransferUserRow } from '../types/CallTransfer.types';
import { transferUsersHeaders } from './_internals/transferUsersHeaders';

/**
 * @author Oleksandr Palonnyi
 * persistence is off: the list lives in a popup, and its search must not land
 * in the route query of the page beneath
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const useTransferUsersDataListStore = createTableStore<TransferUserRow>(
	'ui/call/transfer/users/datalist',
	{
		apiModule: transferUsersApiModule,
		headers: transferUsersHeaders,
		isAppendDataList: true,
		disablePersistence: true,
	},
);
