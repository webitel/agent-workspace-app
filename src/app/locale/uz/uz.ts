import { DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Siz faqat navbatlardan qo‘ng‘iroqlarni qabul qilasiz',
			},
		},
		notifications: {
			offer: {
				title: {
					call: 'Kiruvchi qoʻngʻiroq',
					chat: 'Kiruvchi chat',
				},
				unknownContact: 'Nomaʼlum kontakt',
				queue: 'Navbat',
				channel: 'Kanal',
				waitingTime: 'Kutish vaqti',
				accept: 'Qabul qilish',
				decline: 'Rad etish',
			},
		},
		pages: {
			calls: {
				tabs: {
					missed: 'Oʻtkazib yuborilgan',
				},
				missed: {
					title: 'Oʻtkazib yuborilgan qoʻngʻiroqlar',
					columns: {
						name: 'Ism',
						phoneNumber: 'Telefon raqami',
						dateTime: 'Sana va vaqt',
						totalDuration: 'Umumiy davomiylik',
						queue: 'Navbat',
					},
					search: {
						tooltip: 'Qidiruv',
						placeholder: 'Ism yoki telefon raqami boʻyicha qidirish',
					},
					actions: {
						openContact: 'Kontaktni ochish',
						call: 'Qoʻngʻiroq qilish',
					},
				},
			},
		},
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Mikrofonga ruxsat yoʻq. Amalni bajarib boʻlmaydi.',
		},
	},
};
