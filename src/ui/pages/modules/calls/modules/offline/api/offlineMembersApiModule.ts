import {
	applyTransform,
	snakeToCamel,
	starToSearch,
} from '@webitel/api-services/api/transformers';
import type { ApiModule } from '@webitel/ui-sdk/api/types/ApiModule';

import { useWebSocketClient } from '../../../../../../../app/api/socket/composables/useWebSocketClient';
import type { OfflineMember } from '../types/OfflineMember.types';

interface OfflineMemberList {
	items: OfflineMember[];
	next: boolean;
}

/**
 * Adapts datalist table store params to the SDK's positional
 * `agent.offlineMembers(q, page, perPage, sort)`.
 */
const getList = async (
	params: Record<string, unknown> = {},
): Promise<OfflineMemberList> => {
	const { agent } = useWebSocketClient();

	// no agent session (e.g. a supervisor opened the app): nothing to fetch
	if (!agent.value) {
		return {
			items: [],
			next: false,
		};
	}

	// the backend matches `q` exactly unless it ends with a wildcard
	const { search, page, size, sort } = applyTransform<typeof params>(params, [
		starToSearch('search'),
	]);

	const response = await agent.value.offlineMembers(
		(search as string | undefined) ?? '',
		page as number,
		size as number,
		(sort as string | undefined) ?? '',
	);

	const { items, next } = applyTransform<Partial<OfflineMemberList>>(response, [
		snakeToCamel(),
	]);

	return {
		items: items ?? [],
		next: !!next,
	};
};

export const offlineMembersApiModule = {
	getList,
} satisfies ApiModule<OfflineMember>;
