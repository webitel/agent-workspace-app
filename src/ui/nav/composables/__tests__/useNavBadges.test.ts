import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useNavBadges } from '../useNavBadges';

// the real stores pull in the socket client, router and chat SDK on setup —
// the composable only cares about the counters, so the stores are replaced
const newCallsCount = ref(0);
const newChatsCount = ref(0);

vi.mock('../../../../features/calls/store/calls', () => ({
	useCallsStore: () => ({
		newCallsCount,
	}),
}));
vi.mock('../../../../features/chats/store/chats', () => ({
	useChatsStore: () => ({
		newChatsCount,
	}),
}));

describe('useNavBadges', () => {
	beforeEach(() => {
		newCallsCount.value = 0;
		newChatsCount.value = 0;
	});

	it('maps store counters to route badges', () => {
		newCallsCount.value = 3;
		newChatsCount.value = 5;

		const { badgesByRoute } = useNavBadges();

		expect(badgesByRoute.value['/calls']).toEqual({
			variant: 'error',
			count: 3,
		});
		expect(badgesByRoute.value['/chats']).toEqual({
			variant: 'success',
			count: 5,
		});
	});

	it('updates badges when store counters change', () => {
		const { badgesByRoute } = useNavBadges();

		newCallsCount.value = 7;
		newChatsCount.value = 2;

		expect(badgesByRoute.value['/calls']?.count).toBe(7);
		expect(badgesByRoute.value['/chats']?.count).toBe(2);
	});

	it('has no badge for routes without a counter', () => {
		const { badgesByRoute } = useNavBadges();

		expect(badgesByRoute.value['/contacts']).toBeUndefined();
	});
});
