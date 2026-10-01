const NON_DIALABLE_CHARACTERS = /[^0-9a-zA-Z+*#]/g;

export function sanitizeDestination(rawNumber: string): string {
	return rawNumber.replace(NON_DIALABLE_CHARACTERS, '');
}
