export const CallPanelInfoField = {
	From: 'from',
	To: 'to',
	Queue: 'queue',
} as const;

export type CallPanelInfoField =
	(typeof CallPanelInfoField)[keyof typeof CallPanelInfoField];
