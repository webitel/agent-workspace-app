import { CallDirection, DeviceNotAllowPermissionError } from 'webitel-sdk';

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
		chatList: {
			tabs: {
				active: 'Активные',
				snoozed: 'Отложенные',
			},
			snooze: {
				action: 'Отложить',
				error: 'Не удалось отложить чат',
			},
		},
		notifications: {
			offer: {
				title: {
					call: 'Запрос входящего звонка',
					chat: 'Запрос входящего чата',
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
			startedAt: 'Начато',
			endedAt: 'Завершено',
			username: 'Имя пользователя',
			message: 'Сообщение',
			phoneNumber: 'Номер телефона',
			waitTime: 'Время ожидания',
			select: 'Выбрать',
		},
		numpad: {
			call: 'Позвонить',
		},
		processing: {
			postProcessing: {
				title: 'Пост-обработка',
				extend: 'Продлить пост-обработку',
				extensionsLeft: 'Осталось продлений: {count}',
			},
		},
		variables: {
			empty: 'Переменных нет',
			loadError: 'Не удалось загрузить переменные',
		},
		sidebar: {
			contact: {
				selectContact: {
					title: 'Выберите контакт',
					text: 'Выберите запись из списка истории, чтобы увидеть данные контакта',
				},
				selectOrCreateContact: {
					title: 'Выберите контакт или создайте новый',
					text: 'Выберите контакт из списка для просмотра деталей или создайте новый.',
				},
				createContact: 'Создать контакт',
				addContacts: 'Добавить контакты',
				profile: 'Профиль',
				info: 'Информация',
				groups: 'Группы',
				attributes: 'Атрибуты',
				noAttributes: 'Пользовательские переменные не заданы',
				communicationOptions: 'Способы связи',
				contactPosition: 'Контакт {current} из {count}',
				search: {
					title: 'Поиск контакта',
					noResults: 'Результатов не найдено',
					modes: {
						name: 'Имя',
						destination: 'Номер или email',
						variables: 'Атрибут',
					},
				},
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Пропущенные',
					offline: 'Оффлайн',
					selfAssigned: 'Самостоятельно назначенные',
				},
				tabs: {
					info: 'Информация',
					postProcessing: 'Пост-обработка',
					interaction: 'Взаимодействия',
					screenshots: 'Скриншоты',
					contact: 'Контакт',
					iframe: 'iFrame',
				},
			},
			chats: {
				pageTabs: {
					active: 'Активные',
					closed: 'Закрытые',
				},
				tabs: {
					chat: 'Чат',
					info: 'Инфо',
					postProcessing: 'Пост-обработка',
					interaction: 'Взаимодействие',
					contact: 'Контакт',
					iframe: 'Iframe',
				},
				topBar: {
					pin: 'Закрепить чат',
					transfer: 'Перевести чат',
					end: 'Завершить чат',
				},
				closed: {
					notFound: 'Чат не найден',
					loadError: 'Не удалось загрузить чат',
					retry: 'Попробовать ещё раз',
					taskVariablesUnavailable:
						'Переменные контакт-центра недоступны для закрытых чатов',
				},
			},
			history: {
				tabs: {
					calls: 'Звонки',
				},
				calls: {
					table: {
						mos: 'MOS',
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
						postprocessing: 'Пост-обработка',
						agentDescription: 'Комментарий оператора',
					},
				},
			},
			contacts: {
				phones: {
					call: 'Позвонить на {number}',
					moreNumbers: '+{count} ещё номер(ов)',
					noPhone: 'Нет телефона',
				},
			},
			tableActionPanel: {
				variableColumnSelect: {
					title: 'Выбрать колонки с переменными',
				},
			},
		},
		call: {
			activeCall: {
				inCall: 'В разговоре',
				onHold: 'На удержании',
				hungUp: 'Завершён',
				actions: {
					numpad: 'Клавиатура',
					mute: 'Выключить микрофон',
					hold: 'Удержание',
					camera: 'Камера',
					message: 'Сообщение',
					transfer: 'Переадресация',
					hangup: 'Завершить звонок',
					openFullView: 'Открыть полный вид',
				},
			},
			outboundCall: {
				ringing: 'Вызов',
				noAnswer: 'Нет ответа',
				noAnswerDescription: 'Телефон получателя не ответил на запрос.',
				retryCall: 'Повторить звонок',
				backToDialpad: 'Вернуться к набору номера',
			},
			direction: {
				[CallDirection.Inbound]: 'Входящий вызов',
				[CallDirection.Outbound]: 'Исходящий вызов',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'Не удалось совершить звонок. Попробуйте ещё раз.',
			holdToggleFailed:
				'Не удалось поставить звонок на удержание или снять с него. Попробуйте ещё раз.',
			dtmfFailed: 'Не удалось отправить цифру. Попробуйте ещё раз.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Нет доступа к микрофону. Невозможно выполнить действие.',
		},
	},
};
