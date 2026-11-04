export const SidebarSelectionType = {
	Contact: 'contact',
	Unknown: 'unknown',
} as const;

export type SidebarSelectionType =
	(typeof SidebarSelectionType)[keyof typeof SidebarSelectionType];
