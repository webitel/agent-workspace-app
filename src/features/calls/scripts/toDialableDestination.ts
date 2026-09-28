const NON_DIALABLE_CHARACTERS = /[^0-9a-zA-Z+*#]/g;

export function toDialableDestination(rawNumber: string): string {
	return rawNumber.replace(NON_DIALABLE_CHARACTERS, '');
}
