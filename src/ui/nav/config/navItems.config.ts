import type { NavRailItem } from '../types/NavItem.types';

export const NUMPAD_NAV_ITEM_ID = 'numpad';

export const topNavItems: NavRailItem[] = [
	{
		id: '/',
		icon: 'home-page',
	},
	{
		id: '/calls',
		icon: 'calls',
	},
	{
		id: '/chats',
		icon: 'chats',
	},
	{
		id: '/tasks',
		icon: 'tasks',
	},
];

export const bottomNavItems: NavRailItem[] = [
	{
		id: '/contacts',
		icon: 'ws-contacts',
	},
	{
		id: '/history',
		icon: 'ws-history',
	},
	{
		id: NUMPAD_NAV_ITEM_ID,
		icon: 'calls',
	},
];
