export const WebSocketClientEvent = {
	AfterAuth: 'afterAuth',
	Error: 'error',
	CallMediaMetric: 'call_media_metric',
	Disconnected: 'disconnected',
} as const;

export type WebSocketClientEvent =
	(typeof WebSocketClientEvent)[keyof typeof WebSocketClientEvent];
