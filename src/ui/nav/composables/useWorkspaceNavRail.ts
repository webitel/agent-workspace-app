import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useNumpadStore } from '../../numpad/store/numpad';
import {
	bottomNavItems,
	NUMPAD_NAV_ITEM_ID,
	topNavItems,
} from '../config/navItems.config';
import { getActiveNavItemId } from '../scripts/getActiveNavItemId';
import type {
	NavBadgeConfig,
	NavRailConfig,
	NavRailItem,
} from '../types/NavItem.types';
import { useNavBadges } from './useNavBadges';

const routeItemIds = [
	...topNavItems,
	...bottomNavItems,
]
	.map(({ id }) => id)
	.filter((id) => id !== NUMPAD_NAV_ITEM_ID);

const toRailBadge = (badge?: NavBadgeConfig): NavRailItem['badge'] =>
	badge?.count
		? {
				value: badge.count,
				severity: badge.variant,
			}
		: undefined;

export function useWorkspaceNavRail() {
	const route = useRoute();
	const router = useRouter();
	const { badgesByRoute } = useNavBadges();

	const withBadges = (items: NavRailItem[]): NavRailItem[] =>
		items.map((item) => ({
			...item,
			badge: toRailBadge(badgesByRoute.value[item.id]),
		}));

	const navRail = computed<NavRailConfig>(() => ({
		topItems: withBadges(topNavItems),
		bottomItems: withBadges(bottomNavItems),
		activeItemId: getActiveNavItemId(route.path, routeItemIds),
	}));

	const onNavSelect = ({ id }: Pick<NavRailItem, 'id'>): void => {
		if (id === NUMPAD_NAV_ITEM_ID) {
			useNumpadStore().toggle();
			return;
		}

		router.push(id);
	};

	return {
		navRail,
		onNavSelect,
	};
}
