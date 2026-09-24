import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useCallsStore } from '../../../features/calls/store/calls';
import { useChatsStore } from '../../../features/chats/store/chats';
import type { NavBadgeConfig } from '../types/NavItem.types';

export function useNavBadges() {
	const { newCallsCount } = storeToRefs(useCallsStore());
	const { newChatsCount } = storeToRefs(useChatsStore());

	const badgesByRoute = computed<Partial<Record<string, NavBadgeConfig>>>(
		() => ({
			'/calls': {
				variant: 'error',
				count: newCallsCount.value,
			},
			'/chats': {
				variant: 'success',
				count: newChatsCount.value,
			},
		}),
	);

	return {
		badgesByRoute,
	};
}
