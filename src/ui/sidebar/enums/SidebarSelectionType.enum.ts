export const SidebarSelectionType = {
	Contact: 'contact',
	Unknown: 'unknown',
	PhoneNumber: 'phone-number',
} as const;

export type SidebarSelectionType =
	(typeof SidebarSelectionType)[keyof typeof SidebarSelectionType];
