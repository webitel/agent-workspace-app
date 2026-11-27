import { CallDirection, DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Ви будете отримувати дзвінки тільки з черг',
			},
		},
		chatPreview: {
			onlyUnread: 'Лише непрочитані чати',
		},
		chatList: {
			tabs: {
				active: 'Активні',
				snoozed: 'Відкладені',
			},
			snooze: {
				action: 'Відкласти',
				error: 'Не вдалося відкласти чат',
			},
		},
		notifications: {
			offer: {
				title: {
					call: 'Запит вхідного дзвінка',
					chat: 'Запит вхідного чату',
				},
				channel: 'Канал',
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
			started: 'Розпочато',
			startedAt: 'Початок',
			endedAt: 'Завершено',
			username: "Ім'я користувача",
			message: 'Повідомлення',
			phoneNumber: 'Номер телефону',
			waitTime: 'Час очікування',
			select: 'Обрати',
			unknownContact: 'Невідомий контакт',
			info: 'Інформація',
			interactions: 'Взаємодії',
		},
		numpad: {
			call: 'Подзвонити',
		},
		processing: {
			postProcessing: {
				title: 'Пост-обробка',
				extend: 'Продовжити пост-обробку',
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
					text: 'Виберіть контакт зі списку для перегляду деталей або створіть новий.',
				},
				createContact: 'Створити контакт',
				addContacts: 'Додати контакти',
				profile: 'Профіль',
				groups: 'Групи',
				attributes: 'Атрибути',
				noAttributes: 'Користувацькі змінні не задано',
				communicationOptions: "Способи зв'язку",
				contactPosition: 'Контакт {current} з {count}',
				search: {
					title: 'Пошук контакту',
					noResults: 'Результатів не знайдено',
					modes: {
						name: "Ім'я",
						destination: 'Номер або email',
						variables: 'Атрибут',
					},
				},
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Пропущені',
					offline: 'Офлайн',
					selfAssigned: 'Самостійно призначені',
				},
				searchByNumber: 'Пошук за номером',
				tabs: {
					iframe: 'iFrame',
				},
			},
			chats: {
				pageTabs: {
					closed: 'Закриті',
				},
				tabs: {
					iframe: 'Iframe',
				},
				topBar: {
					pin: 'Закріпити чат',
					transfer: 'Перевести чат',
					end: 'Завершити чат',
				},
				closed: {
					notFound: 'Чат не знайдено',
					loadError: 'Не вдалося завантажити чат',
					retry: 'Спробувати ще раз',
					taskVariablesUnavailable:
						'Змінні контакт-центру для закритих чатів недоступні',
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
						agentDescription: 'Коментар оператора',
					},
				},
			},
			contacts: {
				phones: {
					call: 'Подзвонити на {number}',
					moreNumbers: '+{count} ще номер(ів)',
					noPhone: 'Немає телефону',
				},
				chats: {
					moreChats: '+{count} ще чат(ів)',
					noChat: 'Немає чату',
				},
				emails: {
					moreEmails: '+{count} ще email',
					noEmail: 'Немає email',
				},
			},
		},
		call: {
			ringing: 'Виклик',
			activeCall: {
				inCall: 'У розмові',
				onHold: 'На утриманні',
				hungUp: 'Завершено',
				actions: {
					numpad: 'Клавіатура',
					mute: 'Вимкнути мікрофон',
					hold: 'Утримання',
					camera: 'Камера',
					transfer: 'Переадресація',
					bridge: "З'єднати дзвінки",
					hangup: 'Завершити дзвінок',
					openFullView: 'Відкрити повний вигляд',
				},
			},
			bridge: {
				title: "З'єднання дзвінків",
				connect: "З'єднати",
			},
			transfer: {
				title: 'Переведення дзвінка',
				emptyList: 'Нічого не знайдено',
				columns: {
					name: "Ім'я",
				},
				phoneLabel: 'Перевести на номер',
				phonePlaceholder: 'Введіть номер телефону',
				modes: {
					blind: 'Сліпий',
					consult: 'Консультативний',
				},
			},
			outboundCall: {
				noAnswer: 'Немає відповіді',
				noAnswerDescription: 'Телефон одержувача не відповів на запит.',
				retryCall: 'Повторити дзвінок',
				backToDialpad: 'Повернутися до набору номера',
			},
			direction: {
				[CallDirection.Inbound]: 'Вхідний дзвінок',
				[CallDirection.Outbound]: 'Вихідний дзвінок',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'Не вдалося здійснити дзвінок. Спробуйте ще раз.',
			holdToggleFailed:
				'Не вдалося поставити дзвінок на утримання або зняти з нього. Спробуйте ще раз.',
			dtmfFailed: 'Не вдалося надіслати цифру. Спробуйте ще раз.',
			transferFailed: 'Не вдалося переадресувати дзвінок. Спробуйте ще раз.',
			bridgeFailed: "Не вдалося з'єднати дзвінки. Спробуйте ще раз.",
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Немає доступу до мікрофона. Неможливо виконати дію.',
		},
	},
};
