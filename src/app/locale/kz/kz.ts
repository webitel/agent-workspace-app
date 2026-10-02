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
						title: 'Қоңырау туралы ақпарат',
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
