import { AgentsAPI } from '@webitel/api-services/api';
import { applyTransform } from '@webitel/api-services/api/transformers';
import type { EngineListUserStatus } from '@webitel/api-services/gen/models';

import { toTransferUserRows } from '../scripts/toTransferUserRows';
import type { TransferUserRow } from '../types/CallTransfer.types';

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
 * and the extension a blind transfer dials, in one light row. The table asks
 * only for the fields its headers name, and no column names `extension` or
 * `presence`, so they are added here on top of the table's fields. The
 * user themself is not a transfer target and is left out by `notUserId`, which
 * the caller passes, as an api module does not read stores
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const transferUsersApiModule = {
	getList: async ({
		fields = [],
		notUserId,
		...params
	}: {
		fields?: string[];
		notUserId?: string;
	} & Record<string, unknown> = {}) => {
		const response = await AgentsAPI.getUsersStatus({
			...params,
			fields: [
				...fields,
				'extension',
				'presence',
			],
			notUserId: notUserId
				? [
						notUserId,
					]
				: undefined,
		});

		return applyTransform(response, [
			mapItemsToTransferUserRows,
		]);
	},
};
