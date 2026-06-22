import {
	createMessagesService,
	createServiceConfig,
	createThreadsService,
} from '@webitel/chat-web-sdk';

// Shared config for all chat services; token read lazily to survive refreshes.
const serviceConfig = createServiceConfig({
	baseUrl: import.meta.env.VITE_CHAT_URL,
	accessToken: () => localStorage.getItem('access-token') ?? '',
});

export const threadsService = createThreadsService(serviceConfig);
export const messagesService = createMessagesService(serviceConfig);
