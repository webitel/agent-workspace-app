export const ContactsSidebarScreen = {
	Empty: 'empty',
	Create: 'create',
	Contact: 'contact',
} as const;

export type ContactsSidebarScreen =
	(typeof ContactsSidebarScreen)[keyof typeof ContactsSidebarScreen];
