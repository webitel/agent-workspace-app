import { DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Вы будете получать звонки только из очередей',
			},
		},
		notifications: {
			offer: {
				title: {
					call: 'Входящий звонок',
					chat: 'Входящий чат',
				},
				unknownContact: 'Неизвестный контакт',
				queue: 'Очередь',
				channel: 'Канал',
				waitingTime: 'Время ожидания',
				accept: 'Принять',
				decline: 'Отклонить',
			},
		},
		numpad: {
			call: 'Позвонить',
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'Не удалось совершить звонок. Попробуйте ещё раз.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Нет доступа к микрофону. Невозможно выполнить действие.',
		},
	},
};
