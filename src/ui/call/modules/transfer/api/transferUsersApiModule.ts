import { AgentsAPI } from '@webitel/api-services/api';
import { applyTransform } from '@webitel/api-services/api/transformers';
import type { EngineListUserStatus } from '@webitel/api-services/gen/models';

import { useUserinfoStore } from '../../../../../features/userinfo/stores/userinfoStore';
import { toTransferUserRows } from '../scripts/toTransferUserRows';
import type { TransferUserRow } from '../types/CallTransfer.types';

const DEFAULT_SORT = 'position';

function mapItemsToTransferUserRows(response: EngineListUserStatus): Omit<
	EngineListUserStatus,
	'items'
> & {
	items: TransferUserRow[];
} {
	return {
		...response,
		items: toTransferUserRows(response.items ?? []),
	};
}

/**
 * @author Oleksandr Palonnyi
 * the list is `AgentsAPI.getUsersStatus` and not `UsersAPI.getList`: it is the
 * endpoint cc-workspaces listed this tab from, and the only one that answers
 * with the user's agent status, the presence (both read by the status column)
 * and the extension a blind transfer dials, in one light row. It takes none of
 * the table headers' fields, so the ones a row needs are requested here. The
 * user themself is not a transfer target and is left out by `notUserId`.
 * `position` is the order cc-workspaces asked for; the table store sends
 * `sort: null` when nothing is sorted, which a parameter default would not
 * replace, hence `??`
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const transferUsersApiModule = {
	getList: async ({
		fields = [],
		sort,
		...params
	}: {
		fields?: string[];
		sort?: string | null;
	} & Record<string, unknown> = {}) => {
		const response = await AgentsAPI.getUsersStatus({
			...params,
			sort: sort ?? DEFAULT_SORT,
			fields: [
				...fields,
				'extension',
				'presence',
			],
			notUserId: [
				useUserinfoStore().userId,
			],
		});

		return applyTransform(response, [
			mapItemsToTransferUserRows,
		]);
	},
};
