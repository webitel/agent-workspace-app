import { AgentsAPI } from '@webitel/api-services/api';
import type { EngineListAgent } from '@webitel/api-services/gen/models';

/**
 * @author Oleksandr Palonnyi
 * only the fields a list row shows are requested, the full agent carries
 * skills, channels and supervisors that a list of dozens of agents does not
 * need. `excludedUserIds` takes user ids, not agent ids. The result is
 * `Required` because `getList` fills a missing `items` and `next` with the
 * defaults of `getDefaultGetListResponse`, which the generated type does not
 * know
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export async function searchAgents({
	search,
	page,
	size,
	excludedUserIds = [],
}: {
	search: string;
	page: number;
	size: number;
	excludedUserIds?: string[];
}): Promise<Required<EngineListAgent>> {
	return AgentsAPI.getList({
		search,
		page,
		size,
		notUserId: excludedUserIds,
		fields: [
			'id',
			'name',
			'status',
			'team',
			'user_presence_status',
		],
	});
}
