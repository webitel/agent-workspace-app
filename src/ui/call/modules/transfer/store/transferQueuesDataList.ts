import { createTableStore } from '@webitel/ui-datalist';

import { transferQueuesApiModule } from '../api/transferQueuesApiModule';
import type { TransferQueueRow } from '../types/CallTransfer.types';
import { transferQueuesHeaders } from './_internals/transferQueuesHeaders';

/**
 * @author Oleksandr Palonnyi
 * persistence is off: the list lives in a popup, and its search must not land
 * in the route query of the page beneath
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const useTransferQueuesDataListStore =
	createTableStore<TransferQueueRow>('ui/call/transfer/queues/datalist', {
		apiModule: transferQueuesApiModule,
		headers: transferQueuesHeaders,
		isAppendDataList: true,
		disablePersistence: true,
	});
