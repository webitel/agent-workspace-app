export const CallsPageTab = {
	Missed: 'calls-missed',
} as const;

export type CallsPageTab = (typeof CallsPageTab)[keyof typeof CallsPageTab];
