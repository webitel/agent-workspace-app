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
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Mikrofonga ruxsat yoʻq. Amalni bajarib boʻlmaydi.',
		},
	},
};
