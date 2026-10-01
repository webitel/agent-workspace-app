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
		pages: {
			history: {
				tabs: {
					calls: 'Qoʻngʻiroqlar',
				},
				calls: {
					table: {
						mos: 'MOS',
					},
					recordings: {
						unavailable: 'Yozuv mavjud emas',
						playAudio: 'Audioni ijro etish',
						playVideo: 'Videoni ijro etish',
					},
					actions: {
						showCallInfo: 'Maʼlumotni koʻrsatish',
					},
					callInfo: {
						title: 'Qoʻngʻiroq haqida maʼlumot',
						postprocessing: 'Keyingi ishlov',
						agentDescription: 'Operator izohi',
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
