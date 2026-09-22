export type NavBadgeVariant = 'danger' | 'success';

export interface NavBadgeConfig {
	variant: NavBadgeVariant;
	count: number;
}

interface NavItemBase {
	icon: string;
	wrapperClass?: string;
}

export interface NavLinkItem extends NavItemBase {
	kind: 'link';
	to: string;
	exact?: boolean;
	badge?: NavBadgeConfig;
}

export interface NavButtonItem extends NavItemBase {
	kind: 'button';
}

export type NavItemConfig = NavLinkItem | NavButtonItem;
