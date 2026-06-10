import { eventBus } from '@webitel/ui-sdk/scripts';
import { useI18n } from 'vue-i18n';

import { WebSocketClientEvent } from '../../../app/api/socket/enums/WebSocketClientEvent.enum';
import { useWebSocketClient } from '../../../app/api/socket/useWebSocketClient';

interface WebSocketError {
	id?: string;
	[key: string]: unknown;
}

interface NotificationMessage {
	type: 'error';
	text: string | WebSocketError;
}

export function useSocketNotifications() {
	const { t, te } = useI18n();
	const { on: onWebSocketEvent } = useWebSocketClient();

	function notifyWebSocketError(error: WebSocketError): WebSocketError {
		const errorKey = error.id?.replaceAll('.', '_');
		const localeKey = errorKey ? `error.websocket.${errorKey}` : null;

		const message: NotificationMessage = {
			type: 'error',
			text: localeKey && te(localeKey) ? t(localeKey) : error,
		};

		eventBus.$emit('notification', message);
		return error;
	}

	function subscribeToWebSocketEvents() {
		onWebSocketEvent(WebSocketClientEvent.Error, (error: WebSocketError) => {
			notifyWebSocketError(error);
		});
	}

	return {
		subscribeToWebSocketEvents,
	};
}
