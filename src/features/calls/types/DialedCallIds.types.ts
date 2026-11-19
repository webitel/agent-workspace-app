/**
 * @author Oleksandr Palonnyi
 * What the platform says about a call the agent dialled, as soon as the dial is placed.
 * With a web phone it is the SIP Call-ID the browser sent (`sipId`), known before the call
 * rings; without one, the platform call id (`callId`), known only once the agent's own leg
 * answers. Either may be missing, and an SDK that predates them returns neither
 * [WS-155](https://webitel.atlassian.net/browse/WS-155)
 */
export interface DialedCallIds {
	callId?: string;
	sipId?: string;
}
