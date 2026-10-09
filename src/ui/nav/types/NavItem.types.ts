export type NavBadgeVariant = 'error' | 'success';

export interface NavBadgeConfig {
	variant: NavBadgeVariant;
	count: number;
}

export interface NavRailBadge {
	value: number;
	severity: NavBadgeVariant;
}

export interface NavRailItem {
	id: string;
	icon: string;
	badge?: NavRailBadge | null;
}

export interface NavRailConfig {
	topItems: NavRailItem[];
	bottomItems: NavRailItem[];
	activeItemId: string;
}
