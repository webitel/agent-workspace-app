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
			incoming: {
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
		},
		numpad: {
			placeholder: 'Введіть номер телефону',
			call: 'Подзвонити',
		},
		dialer: {
			outboundCall: {
				ringing: 'Дзвінок',
				noAnswer: 'Немає відповіді',
				noAnswerDescription: 'Абонент не відповів на дзвінок.',
				retryCall: 'Подзвонити ще раз',
				backToDialpad: 'Повернутися до набору',
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
