import { AgentsAPI } from '@webitel/api-services/api';
import { applyTransform } from '@webitel/api-services/api/transformers';
import type { EngineListAgent } from '@webitel/api-services/gen/models';
import { createTableStore } from '@webitel/ui-datalist';

import { useUserinfoStore } from '../../../../../features/userinfo/stores/userinfoStore';
import { toTransferAgentRows } from '../scripts/toTransferAgentRows';
import type { TransferAgentRow } from '../types/CallTransfer.types';
import { transferAgentsHeaders } from './_internals/transferAgentsHeaders';

function mapItemsToTransferAgentRows(response: EngineListAgent): Omit<
	EngineListAgent,
	'items'
> & {
	items: TransferAgentRow[];
} {
	return {
		...response,
		items: toTransferAgentRows(response.items ?? []),
	};
}

/**
 * @author Oleksandr Palonnyi
 * the status column is drawn from two api fields, the agent status and the
 * presence (for DnD), while a header names one, so the presence is requested
 * here. The agent themself is not a transfer target and is left out by
 * `notUserId`, which takes user ids. Persistence is off: the list lives in a
 * popup, and its search must not land in the route query of the page beneath
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const useTransferAgentsDataListStore =
	createTableStore<TransferAgentRow>('ui/call/transfer/agents/datalist', {
		apiModule: {
			getList: async ({
				fields = [],
				...params
			}: {
				fields?: string[];
			} & Record<string, unknown> = {}) => {
				const response = await AgentsAPI.getList({
					...params,
					fields: [
						...fields,
						'user_presence_status',
					],
					notUserId: [
						useUserinfoStore().userId,
					],
				});

				return applyTransform(response, [
					mapItemsToTransferAgentRows,
				]);
			},
		},
		headers: transferAgentsHeaders,
		isAppendDataList: true,
		disablePersistence: true,
	});
