import {
	createMessagesService,
	createServiceConfig,
	createThreadsService,
} from '@webitel/chat-web-sdk';

// Single shared SDK config for every chat service. Token is read lazily on
// each request so it survives refreshes set elsewhere in the app.
const serviceConfig = createServiceConfig({
	baseUrl: import.meta.env.VITE_CHAT_URL,
	accessToken: () => localStorage.getItem('access-token') ?? '',
});

export const threadsService = createThreadsService(serviceConfig);
export const messagesService = createMessagesService(serviceConfig);
