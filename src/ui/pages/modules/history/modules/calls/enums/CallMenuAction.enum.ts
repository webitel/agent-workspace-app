export const CallMenuAction = {
	ShowCallInfo: 'showCallInfo',
	OpenInHistory: 'openInHistory',
} as const;

export type CallMenuAction =
	(typeof CallMenuAction)[keyof typeof CallMenuAction];
