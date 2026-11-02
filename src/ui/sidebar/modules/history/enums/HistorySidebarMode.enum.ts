export const HistorySidebarMode = {
	Empty: 'empty',
	View: 'view',
	Unknown: 'unknown',
} as const;

export type HistorySidebarMode =
	(typeof HistorySidebarMode)[keyof typeof HistorySidebarMode];
