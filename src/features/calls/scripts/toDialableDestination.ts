/**
 * @author Oleksandr Palonnyi
 * Letters stay for extensions and SIP users, `+` for E.164 and `*` / `#` for
 * service codes; spaces, dashes and brackets pasted along with a formatted
 * number are dropped. Same rule as the `CALL` action in cc-workspaces.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
const NON_DIALABLE_CHARACTERS = /[^0-9a-zA-Z+*#]/g;

export function toDialableDestination(rawNumber: string): string {
	return rawNumber.replace(NON_DIALABLE_CHARACTERS, '');
}
