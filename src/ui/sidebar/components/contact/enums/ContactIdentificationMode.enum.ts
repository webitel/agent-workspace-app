export const ContactIdentificationMode = {
	Loading: 'loading',
	NotFound: 'notFound',
	Single: 'single',
	Multiple: 'multiple',
} as const;

export type ContactIdentificationMode =
	(typeof ContactIdentificationMode)[keyof typeof ContactIdentificationMode];
