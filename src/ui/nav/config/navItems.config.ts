import type { NavItemConfig } from '../types/NavItem.types';

export const navItems: NavItemConfig[] = [
	{
		kind: 'link',
		to: '/',
		icon: 'ws-navigation-home-page',
		exact: true,
	},
	{
		kind: 'link',
		to: '/calls',
		icon: 'ws-navigation-calls',
	},
	{
		kind: 'link',
		to: '/chats',
		icon: 'ws-navigation-chats',
	},
	// { kind: 'link', to: '/', icon: 'ws-navigation-mentions' },
	// { kind: 'link', to: '/', icon: 'ws-navigation-email' },
	{
		kind: 'link',
		to: '/tasks',
		icon: 'ws-navigation-tasks',
		wrapperClass: 'the-workspace-nav-list__tasks',
	},
	// { kind: 'link', to: '/chats', icon: 'ws-navigation-knowledge-base' },
	{
		kind: 'link',
		to: '/contacts',
		icon: 'ws-navigation-contacts',
	},
	{
		kind: 'link',
		to: '/history',
		icon: 'ws-navigation-history',
	},
	{
		kind: 'button',
		icon: 'ws-navigation-calls',
	},
];
