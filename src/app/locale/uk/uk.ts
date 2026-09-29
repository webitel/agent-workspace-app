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
		pages: {
			history: {
				tabs: {
					calls: 'Дзвінки',
				},
				calls: {
					table: {
						mos: 'MOS',
					},
					recordings: {
						unavailable: 'Запис недоступний',
						playAudio: 'Відтворити аудіо',
						playVideo: 'Відтворити відео',
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
