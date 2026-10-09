import { fillIconsRepository } from '@webitel/ui-sdk';
import wsChatClock from './ws-chat-clock.svg?raw';
import wsInboundCall from './ws-inbound-call.svg?raw';
import wsMissedCall from './ws-missed-call.svg?raw';
import wsOutboundCall from './ws-outbound-call.svg?raw';
import wsPlayVideo from './ws-play-video.svg?raw';
import wsSidebarClose from './ws-sidebar-close.svg?raw';
import wsSidebarOpen from './ws-sidebar-open.svg?raw';

const icons = {
	'ws-sidebar-open': wsSidebarOpen,
	'ws-sidebar-close': wsSidebarClose,
	'ws-chat-clock': wsChatClock,
	'ws-inbound-call': wsInboundCall,
	'ws-missed-call': wsMissedCall,
	'ws-outbound-call': wsOutboundCall,
	'ws-play-video': wsPlayVideo,
};

fillIconsRepository({
	icons: Object.entries(icons).map(([iconName, svg]) => ({
		iconName,
		svg,
	})),
});
