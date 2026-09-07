export const WebSocketClientEvent = {
	AfterAuth: 'afterAuth',
	Error: 'error',
	CallMediaMetric: 'call_media_metric',
	Disconnected: 'disconnected',
	SubscribeToPhoneRegistration: 'subscribe_to_phone_registration',
} as const;

export type WebSocketClientEvent =
	(typeof WebSocketClientEvent)[keyof typeof WebSocketClientEvent];
