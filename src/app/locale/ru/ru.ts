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
		clientIdentity: {
			unknownContact: 'Неизвестный контакт',
		},
		chatPreview: {
			onlyUnread: 'Только непрочитанные чаты',
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
			flows: {
				runFlowSuccess: 'Схема успешно запущена',
				runFlowError: 'Не удалось запустить схему',
			},
		},
		reusable: {
			run: 'Запустить',
			nothingToShowHere: 'Здесь ничего нет',
		},
		numpad: {
			call: 'Позвонить',
		},
		variables: {
			empty: 'Переменных нет',
			loadError: 'Не удалось загрузить переменные',
		},
		pages: {
			chats: {
				tabs: {
					chat: 'Чат',
					info: 'Инфо',
					postProcessing: 'Постобработка',
					interaction: 'Взаимодействие',
					contact: 'Контакт',
					iframe: 'Iframe',
				},
			},
			history: {
				tabs: {
					calls: 'Звонки',
				},
				calls: {
					table: {
						mos: 'MOS',
						phoneNumber: 'Номер телефона',
					},
					recordings: {
						unavailable: 'Запись недоступна',
						playAudio: 'Воспроизвести аудио',
						playVideo: 'Воспроизвести видео',
					},
					actions: {
						showCallInfo: 'Показать информацию',
					},
					callInfo: {
						title: 'Информация',
						postprocessing: 'Постобработка',
						agentDescription: 'Комментарий оператора',
					},
				},
			},
			tableActionPanel: {
				variableColumnSelect: {
					title: 'Выбрать колонки с переменными',
				},
			},
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
