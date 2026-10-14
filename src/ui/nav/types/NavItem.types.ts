import type { NavigationRailItem } from '@webitel/ui-sdk/components/wt-navigation-rail/types/WtNavigationRail';

export type NavBadgeVariant = 'error' | 'success';

export interface NavBadgeConfig {
	variant: NavBadgeVariant;
	count: number;
}

export interface NavRailConfig {
	topItems: NavigationRailItem[];
	bottomItems: NavigationRailItem[];
	activeItemId: string;
}
