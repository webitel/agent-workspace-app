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
		},
		numpad: {
			call: 'Қоңырау шалу',
		},
		variables: {
			empty: 'Айнымалылар жоқ',
			loadError: 'Айнымалыларды жүктеу мүмкін болмады',
		},
		pages: {
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
			},
			history: {
				tabs: {
					calls: 'Қоңыраулар',
				},
				calls: {
					table: {
						mos: 'MOS',
						phoneNumber: 'Телефон нөмірі',
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
		dialer: {
			activeCall: {
				inCall: 'Сөйлесуде',
				onHold: 'Күтуде',
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
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Микрофонға қол жеткізу мүмкін емес. Әрекетті орындау мүмкін емес.',
		},
	},
};
