export const ContactsPageTab = {
	Contacts: 'contacts',
	Users: 'users',
} as const;

export type ContactsPageTab =
	(typeof ContactsPageTab)[keyof typeof ContactsPageTab];
