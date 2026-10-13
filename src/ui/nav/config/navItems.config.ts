import type { NavRailItem } from '../types/NavItem.types';

export const NUMPAD_NAV_ITEM_ID = 'numpad';

export const topNavItems: NavRailItem[] = [
	{
		id: '/',
		icon: 'home--filled',
	},
	{
		id: '/calls',
		icon: 'call-ringing--filled',
	},
	{
		id: '/chats',
		icon: 'chat--filled',
	},
	{
		id: '/tasks',
		icon: 'job--filled',
	},
];

export const bottomNavItems: NavRailItem[] = [
	{
		id: '/contacts',
		icon: 'contact-book--filled',
	},
	{
		id: '/history',
		icon: 'history',
	},
	{
		id: NUMPAD_NAV_ITEM_ID,
		icon: 'call--filled',
	},
];
