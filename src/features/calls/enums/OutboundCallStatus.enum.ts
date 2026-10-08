/**
 * @author Oleksandr Palonnyi
 * The card shows only Ringing and No answer (AC_16.01.03, AC_16.01.04). Dialing is kept
 * apart from Ringing because there is no `Call` yet, so nothing can be muted and a hangup
 * is deferred. Answered is the hand-off to the active call window (AC_16.01.06) that
 * closes the attempt
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
export const OutboundCallStatus = {
	Dialing: 'dialing',
	Ringing: 'ringing',
	Answered: 'answered',
	NoAnswer: 'noAnswer',
} as const;

export type OutboundCallStatus =
	(typeof OutboundCallStatus)[keyof typeof OutboundCallStatus];
