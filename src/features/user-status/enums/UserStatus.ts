export const UserStatus = {
	Sip: 'sip',
	Web: 'web',
	Dnd: 'dnd',
	Busy: 'busy',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
