export const ContactIdentificationMode = {
	Loading: 'loading',
	NotFound: 'notFound',
	// linked to a contact that failed to load: neither its card nor the Unknown contact
	LinkedContactUnavailable: 'linkedContactUnavailable',
	Single: 'single',
	Multiple: 'multiple',
} as const;

export type ContactIdentificationMode =
	(typeof ContactIdentificationMode)[keyof typeof ContactIdentificationMode];
