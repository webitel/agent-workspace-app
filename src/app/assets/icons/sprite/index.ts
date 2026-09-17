import { fillIconsRepository } from '@webitel/ui-sdk/icons';
import wsSidebarClose from './ws-sidebar-close.svg?raw';
import wsSidebarOpen from './ws-sidebar-open.svg?raw';

const icons = {
	'ws-sidebar-open': wsSidebarOpen,
	'ws-sidebar-close': wsSidebarClose,
};

fillIconsRepository({
	icons: Object.entries(icons).map(([iconName, svg]) => ({
		iconName,
		svg,
	})),
});
