import { AgentsAPI } from '@webitel/api-services/api';

export interface SearchedAgent {
	id: string;
	name?: string;
	status?: string;
	team?: {
		name?: string;
	};
	userPresenceStatus?: {
		status?: string;
	};
}

export interface SearchAgentsResult {
	items: SearchedAgent[];
	next: boolean;
}

/**
 * @author Oleksandr Palonnyi
 * only the fields a list row shows are requested, the full agent carries
 * skills, channels and supervisors that a list of dozens of agents does not
 * need. `excludedUserIds` takes user ids, not agent ids
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
}): Promise<SearchAgentsResult> {
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
