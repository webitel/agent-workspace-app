import type { WaitingCallsSort } from 'webitel-sdk';

import { useWebSocketClient } from '../../../../../../../app/api/socket/composables/useWebSocketClient';

/**
 * Self-assigned calls are pushed over the socket and kept in the SDK, which
 * pages, sorts and searches them itself. So this only hands the table params
 * over to the SDK and returns no items: the table reads the live list from
 * the agent, a copy here would miss the socket updates.
 */
const getList = async (params: Record<string, unknown> = {}) => {
	const { agent } = useWebSocketClient();
	const { search, size, sort } = params;

	agent.value?.setWaitingCallsQuery({
		q: (search as string | undefined) ?? '',
		size: size as number,
		sort: (sort as WaitingCallsSort | null | undefined) ?? null,
	});

	return {};
};

export const selfAssignedCallsApiModule = {
	getList,
};
