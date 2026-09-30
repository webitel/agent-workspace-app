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
		pages: {
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
						showCallInfo: 'Қоңырау туралы ақпарат',
					},
					callInfo: {
						title: 'Қоңырау туралы ақпарат',
						postprocessing: 'Кейінгі өңдеу',
					},
				},
			},
		},
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Микрофонға қол жеткізу мүмкін емес. Әрекетті орындау мүмкін емес.',
		},
	},
};
