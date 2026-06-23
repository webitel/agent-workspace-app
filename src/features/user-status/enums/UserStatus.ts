export const UserStatus = {
	SIP: 'sip',
	WEB: 'web',
	DND: 'dnd',
	BUSY: 'busy',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
