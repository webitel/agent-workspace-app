import { QueueTypeName } from '@webitel/ui-sdk/enums';
import { type Call, CallDirection } from 'webitel-sdk';

/**
 * Whether a call should raise an incoming offer to this agent.
 *
 * Ported from cc-workspaces, which splits the same decision across two
 * divergent predicates (`isIncomingRinging` and the inline gate in
 * `client-handlers.js`). Each clause here is a fixed production bug:
 *
 * - `allowAnswer`      — the SDK's own "this leg is answerable by me" flag
 * - `!isEavesdrop`     — a supervisor listening in must not get accept/decline
 * - `!offline queue`   — callbacks are not live offers (WTEL-4502)
 * - not manually distributed — self-assigned calls are picked from a list
 *
 * The direction triad is deliberately wider than "inbound": the platform also
 * rings the agent's own device first on preview-dialer and no-auto-answer
 * outbound flows, and those are genuine incoming legs (WTEL-3602).
 */

const isInbound = (call: Call) => call.direction === CallDirection.Inbound;

const isPreviewDialer = (call: Call) =>
	call.queue?.queue_type === QueueTypeName.PREVIEW_DIALER;

const isOutboundPreviewDialer = (call: Call) =>
	call.direction === CallDirection.Outbound && isPreviewDialer(call);

const isOutboundAwaitingAnswer = (call: Call) =>
	call.direction === CallDirection.Outbound &&
	!!call.allowAnswer &&
	!!call.params &&
	!call.params.autoAnswer;

export function isIncomingCallOffer(call: Call): boolean {
	if (!call) return false;

	const isAnswerable = Boolean(call.allowAnswer) && !call.isEavesdrop;
	if (!isAnswerable) return false;

	// `manual_distribution` is a *string* on the wire, so a plain falsy check
	// treats the literal 'false' as "manual" and swallows the offer. The SDK's own
	// `Call.manualDistribution` getter compares against 'true' for the same reason.
	const isDistributedToAgent =
		call.queue?.queue_type !== QueueTypeName.OFFLINE_QUEUE &&
		call.queue?.manual_distribution !== 'true';
	if (!isDistributedToAgent) return false;

	return [
		isInbound(call),
		isOutboundPreviewDialer(call),
		isOutboundAwaitingAnswer(call),
	].some(Boolean);
}
