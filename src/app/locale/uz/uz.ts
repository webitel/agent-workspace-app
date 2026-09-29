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
			flows: {
				runFlowSuccess: 'Sxema muvaffaqiyatli ishga tushirildi',
				runFlowError: 'Sxemani ishga tushirib boʻlmadi',
			},
		},
		reusable: {
			run: 'Ishga tushirish',
		},
		numpad: {
			call: 'Qoʻngʻiroq qilish',
		},
		dialer: {
			outboundCall: {
				ringing: 'Qoʻngʻiroq qilinmoqda',
				noAnswer: 'Javob yoʻq',
				noAnswerDescription: 'Abonent telefoni qoʻngʻiroqqa javob bermadi.',
				retryCall: 'Qayta qoʻngʻiroq qilish',
				backToDialpad: 'Raqam terishga qaytish',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'Qoʻngʻiroq qilib boʻlmadi. Qaytadan urinib koʻring.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Mikrofonga ruxsat yoʻq. Amalni bajarib boʻlmaydi.',
		},
	},
};
