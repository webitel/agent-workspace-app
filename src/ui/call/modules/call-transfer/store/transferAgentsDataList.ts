import { AgentsAPI } from '@webitel/api-services/api';
import type { EngineAgent } from '@webitel/api-services/gen/models';
import { createTableStore } from '@webitel/ui-datalist';

import { useUserinfoStore } from '../../../../../features/userinfo/stores/userinfoStore';
import { transferAgentsHeaders } from './_internals/transferAgentsHeaders';

/**
 * @author Oleksandr Palonnyi
 * the status column is drawn from two api fields, the agent status and the
 * presence (for DnD), while a header names one, so the presence is requested
 * here. The agent themself is not a transfer target and is left out by
 * `notUserId`, which takes user ids. Persistence is off: the list lives in a
 * popup, and its search must not land in the route query of the page beneath
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const useTransferAgentsDataListStore = createTableStore<EngineAgent>(
	'ui/call/transfer/agents/datalist',
	{
		apiModule: {
			getList: ({
				fields = [],
				...params
			}: {
				fields?: string[];
			} & Record<string, unknown> = {}) =>
				AgentsAPI.getList({
					...params,
					fields: [
						...fields,
						'user_presence_status',
					],
					notUserId: [
						useUserinfoStore().userId,
					],
				}),
		},
		headers: transferAgentsHeaders,
		isAppendDataList: true,
		disablePersistence: true,
	},
);
