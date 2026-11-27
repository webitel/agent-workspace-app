import { CallDirection, DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Siz faqat navbatlardan qo‘ng‘iroqlarni qabul qilasiz',
			},
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
					call: 'Kiruvchi qoʻngʻiroq soʻrovi',
					chat: 'Kiruvchi chat soʻrovi',
				},
				channel: 'Kanal',
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
			started: 'Boshlangan',
			startedAt: 'Boshlanish vaqti',
			endedAt: 'Tugash vaqti',
			username: 'Foydalanuvchi nomi',
			message: 'Xabar',
			phoneNumber: 'Telefon raqami',
			waitTime: 'Kutish vaqti',
			select: 'Tanlash',
			unknownContact: 'Nomaʼlum kontakt',
			info: 'Maʼlumot',
			interactions: "O'zaro aloqalar",
		},
		numpad: {
			call: 'Qoʻngʻiroq qilish',
		},
		processing: {
			postProcessing: {
				title: 'Keyingi ishlov',
				extend: 'Keyingi ishlovni uzaytirish',
				extensionsLeft: 'Qolgan uzaytirishlar: {count}',
			},
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
				groups: 'Guruhlar',
				attributes: 'Atributlar',
				noAttributes: 'Maxsus oʼzgaruvchilar belgilanmagan',
				communicationOptions: 'Aloqa usullari',
				contactPosition: '{current} / {count} aloqa',
				search: {
					title: 'Kontaktni qidirish',
					noResults: 'Natija topilmadi',
					modes: {
						name: 'Ism',
						destination: 'Raqam yoki email',
						variables: 'Atribut',
					},
				},
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Oʼtkazib yuborilgan',
					offline: 'Oflayn',
					selfAssigned: 'Qoʼlda tayinlangan',
				},
				searchByNumber: 'Raqam boʼyicha qidirish',
				tabs: {
					iframe: 'iFrame',
				},
			},
			chats: {
				pageTabs: {
					closed: 'Yopilgan',
				},
				tabs: {
					iframe: 'Iframe',
				},
				topBar: {
					pin: 'Chatni mahkamlash',
					transfer: 'Chatni yoʻnaltirish',
					end: 'Chatni tugatish',
				},
				closed: {
					notFound: 'Chat topilmadi',
					loadError: 'Chatni yuklab boʻlmadi',
					retry: 'Qayta urinish',
					taskVariablesUnavailable:
						'Yopilgan chatlar uchun kontakt-markaz oʻzgaruvchilari mavjud emas',
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
						agentDescription: 'Operator izohi',
					},
				},
			},
			contacts: {
				phones: {
					call: '{number} raqamiga qo‘ng‘iroq qilish',
					moreNumbers: '+{count} ta raqam yana',
					noPhone: 'Telefon yo‘q',
				},
				chats: {
					moreChats: '+{count} ta chat yana',
					noChat: 'Chat yo‘q',
				},
				emails: {
					moreEmails: '+{count} ta email yana',
					noEmail: 'Email yo‘q',
				},
			},
		},
		call: {
			ringing: 'Qoʻngʻiroq qilinmoqda',
			activeCall: {
				inCall: 'Suhbatda',
				onHold: 'Kutishda',
				hungUp: 'Tugadi',
				actions: {
					numpad: 'Klaviatura',
					mute: 'Mikrofonni oʻchirish',
					hold: 'Kutishga qoʻyish',
					camera: 'Kamera',
					transfer: 'Yoʻnaltirish',
					bridge: 'Qoʻngʻiroqlarni ulash',
					hangup: 'Qoʻngʻiroqni tugatish',
					openFullView: 'Toʻliq koʻrinishni ochish',
				},
			},
			bridge: {
				title: 'Qoʻngʻiroqlarni ulash',
				connect: 'Ulash',
			},
			transfer: {
				title: 'Qoʻngʻiroqni oʻtkazish',
				emptyList: 'Hech narsa topilmadi',
				columns: {
					name: 'Nomi',
				},
				phoneLabel: 'Raqamga oʻtkazish',
				phonePlaceholder: 'Telefon raqamini kiriting',
				modes: {
					blind: 'Toʻgʻridan-toʻgʻri',
					consult: 'Maslahat bilan',
				},
			},
			outboundCall: {
				noAnswer: 'Javob yoʻq',
				noAnswerDescription: 'Abonent telefoni qoʻngʻiroqqa javob bermadi.',
				retryCall: 'Qayta qoʻngʻiroq qilish',
				backToDialpad: 'Raqam terishga qaytish',
			},
			direction: {
				[CallDirection.Inbound]: 'Kiruvchi qoʼngʼiroq',
				[CallDirection.Outbound]: 'Chiquvchi qoʼngʼiroq',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'Qoʻngʻiroq qilib boʻlmadi. Qaytadan urinib koʻring.',
			holdToggleFailed:
				'Qoʻngʻiroqni kutishga qoʻyib yoki davom ettirib boʻlmadi. Qaytadan urinib koʻring.',
			dtmfFailed: 'Raqamni yuborib boʻlmadi. Qaytadan urinib koʻring.',
			transferFailed:
				'Qoʻngʻiroqni oʻtkazib boʻlmadi. Qaytadan urinib koʻring.',
			bridgeFailed: 'Qoʻngʻiroqlarni ulab boʻlmadi. Qaytadan urinib koʻring.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Mikrofonga ruxsat yoʻq. Amalni bajarib boʻlmaydi.',
		},
	},
};
