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
		clientIdentity: {
			unknownContact: 'Nieznany kontakt',
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
			nothingToShowHere: 'Nie ma tu nic do wyświetlenia',
		},
		numpad: {
			call: 'Zadzwoń',
		},
		variables: {
			empty: 'Brak zmiennych',
			loadError: 'Nie udało się wczytać zmiennych',
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
			},
			history: {
				tabs: {
					calls: 'Połączenia',
				},
				calls: {
					table: {
						mos: 'MOS',
						phoneNumber: 'Numer telefonu',
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
						title: 'Informacje',
						postprocessing: 'Przetwarzanie końcowe',
						agentDescription: 'Komentarz agenta',
					},
				},
			},
			tableActionPanel: {
				variableColumnSelect: {
					title: 'Wybierz kolumny zmiennych',
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
