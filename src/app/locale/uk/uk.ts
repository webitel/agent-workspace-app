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
		pages: {
			calls: {
				tabs: {
					missed: 'Пропущені',
				},
				missed: {
					title: 'Пропущені дзвінки',
					columns: {
						name: "Ім'я",
						phoneNumber: 'Номер телефону',
						dateTime: 'Дата та час',
						totalDuration: 'Загальна тривалість',
						queue: 'Черга',
					},
					search: {
						tooltip: 'Пошук',
						placeholder: "Пошук за ім'ям або номером телефону",
					},
					actions: {
						openContact: 'Відкрити контакт',
						call: 'Зателефонувати',
					},
				},
			},
		},
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Немає доступу до мікрофона. Неможливо виконати дію.',
		},
	},
};
