import { DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Ви будете отримувати дзвінки тільки з черг',
			},
		},
		notifications: {
			offer: {
				title: {
					call: 'Вхідний дзвінок',
					chat: 'Вхідний чат',
				},
				unknownContact: 'Невідомий контакт',
				queue: 'Черга',
				channel: 'Канал',
				waitingTime: 'Час очікування',
				accept: 'Прийняти',
				decline: 'Відхилити',
			},
			flows: {
				runFlowSuccess: 'Схема запущена успішно',
				runFlowError: 'Не вдалося запустити схему',
			},
		},
		reusable: {
			run: 'Запустити',
		},
		numpad: {
			call: 'Зателефонувати',
		},
		dialer: {
			outboundCall: {
				ringing: 'Виклик',
				noAnswer: 'Немає відповіді',
				noAnswerDescription: 'Телефон абонента не відповів на виклик.',
				retryCall: 'Повторити дзвінок',
				backToDialpad: 'Назад до набору номера',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'Не вдалося здійснити дзвінок. Спробуйте ще раз.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Немає доступу до мікрофона. Неможливо виконати дію.',
		},
	},
};
