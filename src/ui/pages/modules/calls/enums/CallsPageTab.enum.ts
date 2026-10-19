export const CallsPageTab = {
	Missed: 'calls-missed',
	Offline: 'calls-offline',
} as const;

export type CallsPageTab = (typeof CallsPageTab)[keyof typeof CallsPageTab];
