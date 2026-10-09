export const ActiveChatsColumn = {
	Name: 'name',
	Source: 'source',
	Queue: 'queue',
	StartedAt: 'startedAt',
	Username: 'username',
	Message: 'message',
	Duration: 'duration',
} as const;

export type ActiveChatsColumn =
	(typeof ActiveChatsColumn)[keyof typeof ActiveChatsColumn];
