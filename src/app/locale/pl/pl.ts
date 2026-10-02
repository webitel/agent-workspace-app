import { DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Będziesz otrzymywać połączenia tylko z kolejek',
			},
		},
		notifications: {
			offer: {
				title: {
					call: 'Połączenie przychodzące',
					chat: 'Czat przychodzący',
				},
				unknownContact: 'Nieznany kontakt',
				queue: 'Kolejka',
				channel: 'Kanał',
				waitingTime: 'Czas oczekiwania',
				accept: 'Odbierz',
				decline: 'Odrzuć',
			},
			flows: {
				runFlowSuccess: 'Schemat uruchomiony pomyślnie',
				runFlowError: 'Nie udało się uruchomić schematu',
			},
		},
		reusable: {
			run: 'Uruchom',
		},
		numpad: {
			call: 'Zadzwoń',
		},
		pages: {
			chats: {
				tabs: {
					chat: 'Czat',
					info: 'Informacje',
					postProcessing: 'Przetwarzanie końcowe',
					interaction: 'Interakcja',
					contact: 'Kontakt',
					iframe: 'Iframe',
				},
				info: {
					empty: 'Brak zmiennych',
					loadError: 'Nie udało się wczytać zmiennych czatu',
				},
			},
			history: {
				tabs: {
					calls: 'Połączenia',
				},
				calls: {
					table: {
						mos: 'MOS',
					},
					recordings: {
						unavailable: 'Nagranie niedostępne',
						playAudio: 'Odtwórz audio',
						playVideo: 'Odtwórz wideo',
					},
					actions: {
						showCallInfo: 'Pokaż informacje',
					},
					callInfo: {
						title: 'Informacje o połączeniu',
						postprocessing: 'Przetwarzanie końcowe',
						agentDescription: 'Komentarz agenta',
					},
				},
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed:
				'Nie udało się nawiązać połączenia. Spróbuj ponownie.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Brak dostępu do mikrofonu. Nie można wykonać akcji.',
		},
	},
};
