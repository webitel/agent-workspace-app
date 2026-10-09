export const OutboundCallCardState = {
	Ringing: 'ringing',
	NoAnswer: 'noAnswer',
} as const;

export type OutboundCallCardState =
	(typeof OutboundCallCardState)[keyof typeof OutboundCallCardState];
