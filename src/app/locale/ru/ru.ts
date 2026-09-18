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
			incoming: {
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
		reusable: {
			cancel: 'Отменить',
			run: 'Запустить',
		},
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Нет доступа к микрофону. Невозможно выполнить действие.',
		},
	},
};
