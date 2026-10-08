import { fillIconsRepository } from '@webitel/ui-sdk';
import wsChatClock from './ws-chat-clock.svg?raw';
import wsInboundCall from './ws-inbound-call.svg?raw';
import wsMissedCall from './ws-missed-call.svg?raw';
import wsNavigationCalls from './ws-navigation-calls.svg?raw';
import wsNavigationChats from './ws-navigation-chats.svg?raw';
import wsNavigationContacts from './ws-navigation-contacts.svg?raw';
import wsNavigationHistory from './ws-navigation-history.svg?raw';
import wsNavigationHomePage from './ws-navigation-home-page.svg?raw';
import wsNavigationTasks from './ws-navigation-tasks.svg?raw';
import wsOutboundCall from './ws-outbound-call.svg?raw';
import wsPlayVideo from './ws-play-video.svg?raw';
import wsSidebarClose from './ws-sidebar-close.svg?raw';
import wsSidebarOpen from './ws-sidebar-open.svg?raw';
import wtCallNoAnswer from './wt-call-no-answer.svg?raw';
import wtRingingBell from './wt-ringing-bell.svg?raw';

const icons = {
	'ws-sidebar-open': wsSidebarOpen,
	'ws-sidebar-close': wsSidebarClose,
	'ws-navigation-home-page': wsNavigationHomePage,
	'ws-navigation-calls': wsNavigationCalls,
	'ws-navigation-chats': wsNavigationChats,
	'ws-navigation-tasks': wsNavigationTasks,
	'ws-navigation-contacts': wsNavigationContacts,
	'ws-navigation-history': wsNavigationHistory,
	'ws-chat-clock': wsChatClock,
	'ws-inbound-call': wsInboundCall,
	'ws-missed-call': wsMissedCall,
	'ws-outbound-call': wsOutboundCall,
	'ws-play-video': wsPlayVideo,
	'wt-call-no-answer': wtCallNoAnswer,
	'wt-ringing-bell': wtRingingBell,
};

fillIconsRepository({
	icons: Object.entries(icons).map(([iconName, svg]) => ({
		iconName,
		svg,
	})),
});
