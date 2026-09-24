export const OutboundCallStatus = {
	Dialing: 'dialing',
	Ringing: 'ringing',
	Answered: 'answered',
	NoAnswer: 'noAnswer',
	Ended: 'ended',
} as const;

export type OutboundCallStatus =
	(typeof OutboundCallStatus)[keyof typeof OutboundCallStatus];
