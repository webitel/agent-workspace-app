export const ContactsSidebarMode = {
	Empty: 'empty',
	Create: 'create',
	View: 'view',
} as const;

export type ContactsSidebarMode =
	(typeof ContactsSidebarMode)[keyof typeof ContactsSidebarMode];
