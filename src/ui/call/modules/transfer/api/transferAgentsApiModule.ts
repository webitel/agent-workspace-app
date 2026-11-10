import { AgentsAPI } from '@webitel/api-services/api';
import { applyTransform } from '@webitel/api-services/api/transformers';
import type { EngineListAgent } from '@webitel/api-services/gen/models';

import { useUserinfoStore } from '../../../../../features/userinfo/stores/userinfoStore';
import { toTransferAgentRows } from '../scripts/toTransferAgentRows';
import type { TransferAgentRow } from '../types/CallTransfer.types';

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
 * `notUserId`, which takes user ids
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const transferAgentsApiModule = {
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
};
