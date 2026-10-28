import { DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Сіз тек кезектерден қоңыраулар аласыз',
			},
		},
		clientIdentity: {
			unknownContact: 'Белгісіз контакт',
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
					call: 'Кіріс қоңырау',
					chat: 'Кіріс чат',
				},
				unknownContact: 'Белгісіз контакт',
				queue: 'Кезек',
				channel: 'Арна',
				waitingTime: 'Күту уақыты',
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
			startedAt: 'Басталды',
			username: 'Пайдаланушы аты',
			message: 'Хабарлама',
			phoneNumber: 'Телефон нөмірі',
		},
		numpad: {
			call: 'Қоңырау шалу',
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
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Қабылданбаған',
				},
				tabs: {
					info: 'Ақпарат',
					postProcessing: 'Кейінгі өңдеу',
					interaction: 'Өзара әрекеттер',
					screenshots: 'Скриншоттар',
					contact: 'Контакт',
					iframe: 'iFrame',
				},
			},
			chats: {
				pageTabs: {
					active: 'Белсенді',
				},
				tabs: {
					chat: 'Чат',
					info: 'Ақпарат',
					postProcessing: 'Кейінгі өңдеу',
					interaction: 'Өзара әрекет',
					contact: 'Контакт',
					iframe: 'Iframe',
				},
				topBar: {
					pin: 'Чатты бекіту',
					transfer: 'Чатты қайта бағыттау',
					end: 'Чатты аяқтау',
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
						postprocessing: 'Кейінгі өңдеу',
						agentDescription: 'Оператордың пікірі',
					},
				},
			},
			tableActionPanel: {
				variableColumnSelect: {
					title: 'Айнымалылар бағандарын таңдау',
				},
			},
		},
		call: {
			activeCall: {
				inCall: 'Сөйлесуде',
				onHold: 'Күтуде',
				actions: {
					numpad: 'Пернетақта',
					mute: 'Микрофонды өшіру',
					hold: 'Күтуге қою',
					camera: 'Камера',
					message: 'Хабарлама',
					transfer: 'Қайта бағыттау',
					hangup: 'Қоңырауды аяқтау',
					openFullView: 'Толық көріністі ашу',
				},
			},
			outboundCall: {
				ringing: 'Қоңырау шалынуда',
				noAnswer: 'Жауап жоқ',
				noAnswerDescription: 'Абоненттің телефоны қоңырауға жауап бермеді.',
				retryCall: 'Қайта қоңырау шалу',
				backToDialpad: 'Нөмір теруге оралу',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'Қоңырау шалу мүмкін болмады. Қайталап көріңіз.',
			holdToggleFailed:
				'Қоңырауды күтуге қою немесе жалғастыру мүмкін болмады. Қайталап көріңіз.',
			dtmfFailed: 'Санды жіберу мүмкін болмады. Қайталап көріңіз.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Микрофонға қол жеткізу мүмкін емес. Әрекетті орындау мүмкін емес.',
		},
	},
};
