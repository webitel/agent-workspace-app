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
		dialer: {
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
