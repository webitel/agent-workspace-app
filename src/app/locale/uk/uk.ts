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
		clientIdentity: {
			unknownContact: 'Невідомий контакт',
		},
		chatPreview: {
			onlyUnread: 'Лише непрочитані чати',
		},
		chatList: {
			tabs: {
				active: 'Активні',
				snoozed: 'Відкладені',
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
			nothingToShowHere: 'Тут нічого немає',
			startedAt: 'Початок',
			username: "Ім'я користувача",
			message: 'Повідомлення',
			phoneNumber: 'Номер телефону',
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
		sidebar: {
			contact: {
				selectContact: {
					title: 'Виберіть контакт',
					text: 'Виберіть запис зі списку історії, щоб переглянути дані контакту',
				},
				selectOrCreateContact: {
					title: 'Виберіть контакт або створіть новий',
					text: 'Виберіть контакт зі списку, щоб переглянути його дані, або створіть новий.',
				},
				createContact: 'Створити контакт',
				addContacts: 'Додати контакти',
				profile: 'Профіль',
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Пропущені',
				},
				tabs: {
					info: 'Інфо',
					postProcessing: 'Постобробка',
					interaction: 'Взаємодія',
					contact: 'Контакт',
				},
			},
			chats: {
				pageTabs: {
					active: 'Активні',
				},
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
			tableActionPanel: {
				variableColumnSelect: {
					title: 'Вибрати колонки зі змінними',
				},
			},
		},
		call: {
			activeCall: {
				inCall: 'У розмові',
				onHold: 'На утриманні',
				actions: {
					numpad: 'Клавіатура',
					mute: 'Вимкнути мікрофон',
					hold: 'Утримання',
					camera: 'Камера',
					message: 'Повідомлення',
					transfer: 'Переадресація',
					hangup: 'Завершити дзвінок',
					openFullView: 'Відкрити повний вигляд',
				},
			},
			transfer: {
				title: 'Переведення дзвінка',
				numberLabel: 'Перевести на номер',
				numberPlaceholder: 'Введіть номер телефону',
				modes: {
					blind: 'Сліпий',
					consult: 'Консультативний',
				},
				tabs: {
					agents: 'Оператори',
					queues: 'Черги',
					users: 'Користувачі',
					dialplans: 'Правила набору',
				},
			},
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
			holdToggleFailed:
				'Не вдалося поставити дзвінок на утримання або зняти з нього. Спробуйте ще раз.',
			dtmfFailed: 'Не вдалося надіслати цифру. Спробуйте ще раз.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Немає доступу до мікрофона. Неможливо виконати дію.',
		},
	},
};
