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
		},
		pages: {
			calls: {
				tabs: {
					missed: 'Қабылданбаған',
				},
				missed: {
					title: 'Қабылданбаған қоңыраулар',
					columns: {
						name: 'Аты',
						phoneNumber: 'Телефон нөмірі',
						dateTime: 'Күні мен уақыты',
						totalDuration: 'Жалпы ұзақтығы',
						queue: 'Кезек',
					},
					search: {
						tooltip: 'Іздеу',
						placeholder: 'Аты немесе телефон нөмірі бойынша іздеу',
					},
					actions: {
						openContact: 'Контактіні ашу',
						call: 'Қоңырау шалу',
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
