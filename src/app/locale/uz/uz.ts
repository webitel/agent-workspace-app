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
		clientIdentity: {
			unknownContact: 'Nomaʼlum kontakt',
		},
		chatPreview: {
			onlyUnread: 'Faqat o‘qilmagan chatlar',
		},
		chatList: {
			tabs: {
				active: 'Faol',
				snoozed: 'Kechiktirilgan',
			},
			snooze: {
				action: 'Kechiktirish',
				error: "Chatni kechiktirib bo'lmadi",
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
			nothingToShowHere: 'Bu yerda hech narsa yoʼq',
			startedAt: 'Boshlangan',
			username: 'Foydalanuvchi nomi',
			message: 'Xabar',
			phoneNumber: 'Telefon raqami',
		},
		numpad: {
			call: 'Qoʻngʻiroq qilish',
		},
		variables: {
			empty: "O'zgaruvchilar yo'q",
			loadError: "O'zgaruvchilarni yuklab bo'lmadi",
		},
		sidebar: {
			contact: {
				selectContact: {
					title: 'Kontaktni tanlang',
					text: 'Kontakt maʼlumotlarini koʼrish uchun tarix roʼyxatidan yozuvni tanlang',
				},
				selectOrCreateContact: {
					title: 'Kontaktni tanlang yoki yangisini yarating',
					text: 'Maʼlumotlarini koʼrish uchun roʼyxatdan kontaktni tanlang yoki yangisini yarating.',
				},
				createContact: 'Kontakt yaratish',
				addContacts: 'Kontaktlarni qoʼshish',
				profile: 'Profil',
				info: 'Maʼlumot',
				groups: 'Guruhlar',
				attributes: 'Atributlar',
				noAttributes: 'Maxsus oʼzgaruvchilar belgilanmagan',
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Oʼtkazib yuborilgan',
				},
				tabs: {
					info: "Ma'lumot",
					postProcessing: 'Keyingi ishlov',
					interaction: "O'zaro aloqalar",
					screenshots: 'Skrinshotlar',
					contact: 'Kontakt',
					iframe: 'iFrame',
				},
			},
			chats: {
				pageTabs: {
					active: 'Faol',
				},
				tabs: {
					chat: 'Chat',
					info: "Ma'lumot",
					postProcessing: 'Keyingi ishlov',
					interaction: "O'zaro aloqa",
					contact: 'Kontakt',
					iframe: 'Iframe',
				},
				topBar: {
					pin: 'Chatni mahkamlash',
					transfer: 'Chatni yoʻnaltirish',
					end: 'Chatni tugatish',
				},
			},
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
						title: 'Maʼlumot',
						postprocessing: 'Keyingi ishlov',
						agentDescription: 'Operator izohi',
					},
				},
			},
			tableActionPanel: {
				variableColumnSelect: {
					title: 'O‘zgaruvchilar ustunini tanlash',
				},
			},
		},
		call: {
			activeCall: {
				inCall: 'Suhbatda',
				onHold: 'Kutishda',
				actions: {
					numpad: 'Klaviatura',
					mute: 'Mikrofonni oʻchirish',
					hold: 'Kutishga qoʻyish',
					camera: 'Kamera',
					message: 'Xabar',
					transfer: 'Yoʻnaltirish',
					hangup: 'Qoʻngʻiroqni tugatish',
					openFullView: 'Toʻliq koʻrinishni ochish',
				},
			},
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
			holdToggleFailed:
				'Qoʻngʻiroqni kutishga qoʻyib yoki davom ettirib boʻlmadi. Qaytadan urinib koʻring.',
			dtmfFailed: 'Raqamni yuborib boʻlmadi. Qaytadan urinib koʻring.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Mikrofonga ruxsat yoʻq. Amalni bajarib boʻlmaydi.',
		},
	},
};
