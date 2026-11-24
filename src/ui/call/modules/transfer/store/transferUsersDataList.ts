import { createTableStore } from '@webitel/ui-datalist';

import { useUserinfoStore } from '../../../../../features/userinfo/stores/userinfoStore';
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
	'ui/calls/transfer/users/datalist',
	{
		apiModule: {
			getList: (params: Record<string, unknown> = {}) =>
				transferUsersApiModule.getList({
					...params,
					notUserId: useUserinfoStore().userId,
				}),
		},
		headers: transferUsersHeaders,
		isAppendDataList: true,
		disablePersistence: true,
	},
);
