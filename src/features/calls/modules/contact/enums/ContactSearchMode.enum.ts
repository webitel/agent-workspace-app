export const ContactSearchMode = {
	Name: 'name',
	Destination: 'destination',
	Attribute: 'attribute',
} as const;

export type ContactSearchMode =
	(typeof ContactSearchMode)[keyof typeof ContactSearchMode];
