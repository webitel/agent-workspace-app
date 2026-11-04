export const WebSocketClientEvent = {
	AfterAuth: 'afterAuth',
	Error: 'error',
	CallMediaMetric: 'call_media_metric',
	Disconnected: 'disconnected',
	PhoneRegistered: 'phone_registered',
	SystemSettingsChanged: 'system_settings_changed',
} as const;

export type WebSocketClientEvent =
	(typeof WebSocketClientEvent)[keyof typeof WebSocketClientEvent];
