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
			cancel: 'Бас тарту',
			run: 'Іске қосу',
		},
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Микрофонға қол жеткізу мүмкін емес. Әрекетті орындау мүмкін емес.',
		},
	},
};
