export const ChatsPageTab = {
	Active: 'chats-active',
} as const;

export type ChatsPageTab = (typeof ChatsPageTab)[keyof typeof ChatsPageTab];
