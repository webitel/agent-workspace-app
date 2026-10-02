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
		processing: {
			postProcessing: {
				title: 'Постобробка',
				extend: 'Продовжити постобробку',
				extensionsLeft: 'Залишилось продовжень: {count}',
			},
		},
		variables: {
			empty: 'Змінних немає',
			loadError: 'Не вдалося завантажити змінні',
		},
		pages: {
			chats: {
				tabs: {
					chat: 'Чат',
					info: 'Інфо',
					postProcessing: 'Постобробка',
					interaction: 'Взаємодія',
					contact: 'Контакт',
					iframe: 'Iframe',
				},
				topBar: {
					transfer: 'Перевести чат',
					end: 'Завершити чат',
				},
			},
			history: {
				tabs: {
					calls: 'Дзвінки',
				},
				calls: {
					table: {
						mos: 'MOS',
						phoneNumber: 'Номер телефону',
					},
					recordings: {
						unavailable: 'Запис недоступний',
						playAudio: 'Відтворити аудіо',
						playVideo: 'Відтворити відео',
					},
					actions: {
						showCallInfo: 'Показати інформацію',
					},
					callInfo: {
						title: 'Інформація',
						postprocessing: 'Постобробка',
						agentDescription: 'Коментар оператора',
					},
				},
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
