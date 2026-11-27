/**
 * @author Oleksandr Palonnyi
 * What the platform says about a call the agent dialled, as soon as the dial is placed.
 * With a web phone it is the SIP Call-ID the browser sent (`sipId`), known before the call
 * rings; without one, the platform call id (`callId`), known only once the agent's own leg
 * answers. An external phone, and a web phone dial that failed, return neither
 * [WS-155](https://webitel.atlassian.net/browse/WS-155) [NWS][FE] Відкривати плажку активного дзвінка в розгорнутому стані після прийняття вихідного дзвінка
 */
export interface DialedCallIds {
	callId?: string;
	sipId?: string;
}
