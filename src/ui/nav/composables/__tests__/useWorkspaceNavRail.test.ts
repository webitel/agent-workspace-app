import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import type { NavBadgeConfig } from '../../types/NavItem.types';
import { useWorkspaceNavRail } from '../useWorkspaceNavRail';

const routePath = ref('/');
const routerPush = vi.fn();
const toggleNumpad = vi.fn();
const badgesByRoute = ref<Partial<Record<string, NavBadgeConfig>>>({});

vi.mock('vue-router', () => ({
	useRoute: () => ({
		get path() {
			return routePath.value;
		},
	}),
	useRouter: () => ({
		push: routerPush,
	}),
}));
vi.mock('../../../numpad/store/numpad', () => ({
	useNumpadStore: () => ({
		toggle: toggleNumpad,
	}),
}));
vi.mock('../useNavBadges', () => ({
	useNavBadges: () => ({
		badgesByRoute,
	}),
}));

describe('useWorkspaceNavRail', () => {
	beforeEach(() => {
		routePath.value = '/';
		badgesByRoute.value = {};
		routerPush.mockClear();
		toggleNumpad.mockClear();
	});

	describe('navRail', () => {
		it('lists top and bottom items', () => {
			const { navRail } = useWorkspaceNavRail();

			expect(navRail.value.topItems.map(({ id }) => id)).toEqual([
				'/',
				'/calls',
				'/chats',
				'/tasks',
			]);
			expect(navRail.value.bottomItems.map(({ id }) => id)).toEqual([
				'/contacts',
				'/history',
				'numpad',
			]);
		});

		it('marks the item matching the current route as active', () => {
			routePath.value = '/chats';

			const { navRail } = useWorkspaceNavRail();

			expect(navRail.value.activeItemId).toBe('/chats');
		});

		it('never marks the numpad item as active', () => {
			routePath.value = '/numpad';

			const { navRail } = useWorkspaceNavRail();

			expect(navRail.value.activeItemId).not.toBe('numpad');
		});

		it('maps a counter to a rail badge with the matching severity', () => {
			badgesByRoute.value = {
				'/calls': {
					variant: 'error',
					count: 3,
				},
				'/chats': {
					variant: 'success',
					count: 5,
				},
			};

			const { navRail } = useWorkspaceNavRail();
			const [, calls, chats] = navRail.value.topItems;

			expect(calls.badge).toEqual({
				value: 3,
				severity: 'error',
			});
			expect(chats.badge).toEqual({
				value: 5,
				severity: 'success',
			});
		});

		it('hides the badge when its counter is zero', () => {
			badgesByRoute.value = {
				'/calls': {
					variant: 'error',
					count: 0,
				},
			};

			const { navRail } = useWorkspaceNavRail();

			expect(navRail.value.topItems[1].badge).toBeUndefined();
		});

		it('has no badge on items without a counter', () => {
			const { navRail } = useWorkspaceNavRail();

			expect(navRail.value.bottomItems[0].badge).toBeUndefined();
		});

		it('updates badges when counters change', () => {
			const { navRail } = useWorkspaceNavRail();
			expect(navRail.value.topItems[1].badge).toBeUndefined();

			badgesByRoute.value = {
				'/calls': {
					variant: 'error',
					count: 2,
				},
			};

			expect(navRail.value.topItems[1].badge?.value).toBe(2);
		});
	});

	describe('onNavSelect', () => {
		it('navigates to the selected route item', () => {
			const { onNavSelect } = useWorkspaceNavRail();

			onNavSelect({
				id: '/contacts',
			});

			expect(routerPush).toHaveBeenCalledWith('/contacts');
			expect(toggleNumpad).not.toHaveBeenCalled();
		});

		it('toggles the numpad instead of navigating when numpad is selected', () => {
			const { onNavSelect } = useWorkspaceNavRail();

			onNavSelect({
				id: 'numpad',
			});

			expect(toggleNumpad).toHaveBeenCalledOnce();
			expect(routerPush).not.toHaveBeenCalled();
		});
	});
});
