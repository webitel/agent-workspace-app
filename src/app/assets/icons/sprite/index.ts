import { fillIconsRepository } from '@webitel/ui-sdk';
import wsNavigationCalls from './ws-navigation-calls.svg?raw';
import wsNavigationChats from './ws-navigation-chats.svg?raw';
import wsNavigationContacts from './ws-navigation-contacts.svg?raw';
import wsNavigationHistory from './ws-navigation-history.svg?raw';
import wsNavigationHomePage from './ws-navigation-home-page.svg?raw';
import wsNavigationTasks from './ws-navigation-tasks.svg?raw';
import wsSidebarClose from './ws-sidebar-close.svg?raw';
import wsSidebarOpen from './ws-sidebar-open.svg?raw';

const icons = {
	'ws-sidebar-open': wsSidebarOpen,
	'ws-sidebar-close': wsSidebarClose,
	'ws-navigation-home-page': wsNavigationHomePage,
	'ws-navigation-calls': wsNavigationCalls,
	'ws-navigation-chats': wsNavigationChats,
	'ws-navigation-tasks': wsNavigationTasks,
	'ws-navigation-contacts': wsNavigationContacts,
	'ws-navigation-history': wsNavigationHistory,
};

fillIconsRepository({
	icons: Object.entries(icons).map(([iconName, svg]) => ({
		iconName,
		svg,
	})),
});
