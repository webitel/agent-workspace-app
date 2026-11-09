export const CallsPageTab = {
	Missed: 'calls-missed',
	SelfAssigned: 'calls-self-assigned',
	Offline: 'calls-offline',
} as const;

export type CallsPageTab = (typeof CallsPageTab)[keyof typeof CallsPageTab];
