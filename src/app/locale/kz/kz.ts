import { CallDirection, DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Сіз тек кезектерден қоңыраулар аласыз',
			},
		},
		chatPreview: {
			onlyUnread: 'Тек оқылмаған чаттар',
		},
		chatList: {
			tabs: {
				active: 'Белсенді',
				snoozed: 'Кейінге қалдырылған',
			},
			snooze: {
				action: 'Кейінге қалдыру',
				error: 'Чатты кейінге қалдыру мүмкін болмады',
			},
		},
		notifications: {
			offer: {
				title: {
					call: 'Кіріс қоңырау сұрауы',
					chat: 'Кіріс чат сұрауы',
				},
				channel: 'Арна',
				accept: 'Қабылдау',
				decline: 'Бас тарту',
			},
			flows: {
				runFlowSuccess: 'Схема сәтті іске қосылды',
				runFlowError: 'Схеманы іске қосу сәтсіз аяқталды',
			},
		},
		reusable: {
			run: 'Іске қосу',
			nothingToShowHere: 'Мұнда ештеңе жоқ',
			started: 'Басталды',
			startedAt: 'Басталу уақыты',
			endedAt: 'Аяқталу уақыты',
			username: 'Пайдаланушы аты',
			message: 'Хабарлама',
			phoneNumber: 'Телефон нөмірі',
			waitTime: 'Күту уақыты',
			select: 'Таңдау',
			unknownContact: 'Белгісіз контакт',
			info: 'Ақпарат',
			interactions: 'Өзара әрекеттер',
		},
		numpad: {
			call: 'Қоңырау шалу',
		},
		processing: {
			postProcessing: {
				title: 'Кейінгі өңдеу',
				extend: 'Кейінгі өңдеуді ұзарту',
				extensionsLeft: 'Қалған ұзартулар: {count}',
			},
		},
		variables: {
			empty: 'Айнымалылар жоқ',
			loadError: 'Айнымалыларды жүктеу мүмкін болмады',
		},
		sidebar: {
			contact: {
				selectContact: {
					title: 'Контактіні таңдаңыз',
					text: 'Контакт деректерін көру үшін тарих тізімінен жазбаны таңдаңыз',
				},
				selectOrCreateContact: {
					title: 'Контактіні таңдаңыз немесе жаңасын жасаңыз',
					text: 'Мәліметтерін көру үшін тізімнен контактіні таңдаңыз немесе жаңасын жасаңыз.',
				},
				createContact: 'Контакт жасау',
				addContacts: 'Контактілерді қосу',
				profile: 'Профиль',
				groups: 'Топтар',
				attributes: 'Атрибуттар',
				noAttributes: 'Пайдаланушы айнымалылары анықталмаған',
				communicationOptions: 'Байланыс тәсілдері',
				contactPosition: '{current} / {count} байланыс',
				search: {
					title: 'Байланысты іздеу',
					noResults: 'Нәтиже табылмады',
					modes: {
						name: 'Аты',
						destination: 'Нөмір немесе email',
						variables: 'Атрибут',
					},
				},
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Қабылданбаған',
					offline: 'Офлайн',
					selfAssigned: 'Өзіне тағайындалған',
				},
				tabs: {
					iframe: 'iFrame',
				},
			},
			chats: {
				pageTabs: {
					closed: 'Жабық',
				},
				tabs: {
					iframe: 'Iframe',
				},
				topBar: {
					pin: 'Чатты бекіту',
					transfer: 'Чатты қайта бағыттау',
					end: 'Чатты аяқтау',
				},
				closed: {
					notFound: 'Чат табылмады',
					loadError: 'Чатты жүктеу мүмкін болмады',
					retry: 'Қайталап көру',
					taskVariablesUnavailable:
						'Жабық чаттар үшін байланыс орталығының айнымалылары қолжетімсіз',
				},
			},
			history: {
				tabs: {
					calls: 'Қоңыраулар',
				},
				calls: {
					table: {
						mos: 'MOS',
					},
					recordings: {
						unavailable: 'Жазба қолжетімсіз',
						playAudio: 'Аудионы ойнату',
						playVideo: 'Бейнені ойнату',
					},
					actions: {
						showCallInfo: 'Ақпаратты көрсету',
					},
					callInfo: {
						title: 'Ақпарат',
						agentDescription: 'Оператордың пікірі',
					},
				},
			},
			contacts: {
				phones: {
					call: '{number} нөміріне қоңырау шалу',
					moreNumbers: '+{count} нөмір тағы',
					noPhone: 'Телефон жоқ',
				},
				chats: {
					moreChats: '+{count} чат тағы',
					noChat: 'Чат жоқ',
				},
				emails: {
					moreEmails: '+{count} email тағы',
					noEmail: 'Email жоқ',
				},
			},
		},
		call: {
			ringing: 'Қоңырау шалынуда',
			activeCall: {
				inCall: 'Сөйлесуде',
				onHold: 'Күтуде',
				hungUp: 'Аяқталды',
				actions: {
					numpad: 'Пернетақта',
					mute: 'Микрофонды өшіру',
					hold: 'Күтуге қою',
					camera: 'Камера',
					transfer: 'Қайта бағыттау',
					bridge: 'Қоңырауларды қосу',
					hangup: 'Қоңырауды аяқтау',
					openFullView: 'Толық көріністі ашу',
				},
			},
			bridge: {
				title: 'Қоңырауларды қосу',
				connect: 'Қосу',
			},
			transfer: {
				title: 'Қоңырауды ауыстыру',
				emptyList: 'Ештеңе табылмады',
				columns: {
					name: 'Аты',
				},
				phoneLabel: 'Нөмірге ауыстыру',
				phonePlaceholder: 'Телефон нөмірін енгізіңіз',
				modes: {
					blind: 'Тікелей',
					consult: 'Кеңесумен',
				},
			},
			outboundCall: {
				noAnswer: 'Жауап жоқ',
				noAnswerDescription: 'Абоненттің телефоны қоңырауға жауап бермеді.',
				retryCall: 'Қайта қоңырау шалу',
				backToDialpad: 'Нөмір теруге оралу',
			},
			direction: {
				[CallDirection.Inbound]: 'Кіріс қоңырау',
				[CallDirection.Outbound]: 'Шығыс қоңырау',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'Қоңырау шалу мүмкін болмады. Қайталап көріңіз.',
			holdToggleFailed:
				'Қоңырауды күтуге қою немесе жалғастыру мүмкін болмады. Қайталап көріңіз.',
			dtmfFailed: 'Санды жіберу мүмкін болмады. Қайталап көріңіз.',
			transferFailed: 'Қоңырауды ауыстыру мүмкін болмады. Қайталап көріңіз.',
			bridgeFailed: 'Қоңырауларды қосу мүмкін болмады. Қайталап көріңіз.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Микрофонға қол жеткізу мүмкін емес. Әрекетті орындау мүмкін емес.',
		},
	},
};
