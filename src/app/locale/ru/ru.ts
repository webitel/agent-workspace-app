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
		pages: {
			calls: {
				tabs: {
					missed: 'Пропущенные',
				},
				missed: {
					title: 'Пропущенные звонки',
					columns: {
						name: 'Имя',
						phoneNumber: 'Номер телефона',
						dateTime: 'Дата и время',
						totalDuration: 'Общая продолжительность',
						queue: 'Очередь',
					},
					search: {
						tooltip: 'Поиск',
						placeholder: 'Поиск по имени или номеру телефона',
					},
					actions: {
						openContact: 'Открыть контакт',
						call: 'Позвонить',
					},
				},
			},
		},
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Нет доступа к микрофону. Невозможно выполнить действие.',
		},
	},
};
