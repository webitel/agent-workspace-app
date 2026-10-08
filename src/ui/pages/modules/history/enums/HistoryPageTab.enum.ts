export const HistoryPageTab = {
	Calls: 'history-calls',
	Chats: 'history-chats',
} as const;

export type HistoryPageTab =
	(typeof HistoryPageTab)[keyof typeof HistoryPageTab];
