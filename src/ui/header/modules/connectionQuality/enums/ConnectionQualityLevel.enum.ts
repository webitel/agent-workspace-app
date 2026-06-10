export const ConnectionQualityLevel = {
	High: 'high',
	Medium: 'medium',
	Low: 'low',
} as const;

export type ConnectionQualityLevel =
	(typeof ConnectionQualityLevel)[keyof typeof ConnectionQualityLevel];
