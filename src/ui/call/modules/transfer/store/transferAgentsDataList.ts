import { createTableStore } from '@webitel/ui-datalist';

import { transferAgentsApiModule } from '../api/transferAgentsApiModule';
import type { TransferAgentRow } from '../types/CallTransfer.types';
import { transferAgentsHeaders } from './_internals/transferAgentsHeaders';

/**
 * @author Oleksandr Palonnyi
 * persistence is off: the list lives in a popup, and its search must not land
 * in the route query of the page beneath
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const useTransferAgentsDataListStore =
	createTableStore<TransferAgentRow>('ui/call/transfer/agents/datalist', {
		apiModule: transferAgentsApiModule,
		headers: transferAgentsHeaders,
		isAppendDataList: true,
		disablePersistence: true,
	});
