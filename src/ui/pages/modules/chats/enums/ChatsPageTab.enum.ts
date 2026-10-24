export const ChatsPageTab = {
	Active: 'chats-active',
	Closed: 'chats-closed',
} as const;

export type ChatsPageTab = (typeof ChatsPageTab)[keyof typeof ChatsPageTab];
