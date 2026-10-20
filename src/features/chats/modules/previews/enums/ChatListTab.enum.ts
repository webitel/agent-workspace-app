export const ChatListTab = {
	Active: 'chat-list-active',
	Snoozed: 'chat-list-snoozed',
} as const;

export type ChatListTab = (typeof ChatListTab)[keyof typeof ChatListTab];
