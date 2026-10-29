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
		chatPreview: {
			onlyUnread: 'Tylko nieprzeczytane czaty',
		},
		chatList: {
			tabs: {
				active: 'Aktywne',
				snoozed: 'Odłożone',
			},
			snooze: {
				action: 'Odłóż',
				error: 'Nie udało się odłożyć czatu',
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
			nothingToShowHere: 'Nie ma tu nic do wyświetlenia',
			startedAt: 'Rozpoczęto',
			username: 'Nazwa użytkownika',
			message: 'Wiadomość',
			phoneNumber: 'Numer telefonu',
		},
		numpad: {
			call: 'Zadzwoń',
		},
		variables: {
			empty: 'Brak zmiennych',
			loadError: 'Nie udało się wczytać zmiennych',
		},
		sidebar: {
			contact: {
				selectContact: {
					title: 'Wybierz kontakt',
					text: 'Wybierz rekord z listy historii, aby zobaczyć szczegóły kontaktu',
				},
				selectOrCreateContact: {
					title: 'Wybierz kontakt lub utwórz nowy',
					text: 'Wybierz kontakt z listy, aby zobaczyć jego szczegóły, lub utwórz nowy.',
				},
				createContact: 'Utwórz kontakt',
				addContacts: 'Dodaj kontakty',
				profile: 'Profil',
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Nieodebrane',
				},
				tabs: {
					info: 'Informacje',
					postProcessing: 'Przetwarzanie końcowe',
					interaction: 'Interakcje',
					screenshots: 'Zrzuty ekranu',
					contact: 'Kontakt',
					iframe: 'iFrame',
				},
			},
			chats: {
				pageTabs: {
					active: 'Aktywne',
				},
				tabs: {
					chat: 'Czat',
					info: 'Informacje',
					postProcessing: 'Przetwarzanie końcowe',
					interaction: 'Interakcja',
					contact: 'Kontakt',
					iframe: 'Iframe',
				},
				topBar: {
					pin: 'Przypnij czat',
					transfer: 'Przekieruj czat',
					end: 'Zakończ czat',
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
		call: {
			activeCall: {
				inCall: 'W rozmowie',
				onHold: 'Wstrzymane',
				actions: {
					numpad: 'Klawiatura',
					mute: 'Wycisz',
					hold: 'Wstrzymaj',
					camera: 'Kamera',
					message: 'Wiadomość',
					transfer: 'Przekieruj',
					hangup: 'Zakończ połączenie',
					openFullView: 'Otwórz pełny widok',
				},
			},
			transfer: {
				title: 'Przekieruj połączenie',
				numberLabel: 'Przekieruj na numer',
				numberPlaceholder: 'Wpisz numer telefonu',
				modes: {
					blind: 'Bez konsultacji',
					consult: 'Z konsultacją',
				},
			},
			outboundCall: {
				ringing: 'Dzwonienie',
				noAnswer: 'Brak odpowiedzi',
				noAnswerDescription: 'Telefon odbiorcy nie odpowiedział na połączenie.',
				retryCall: 'Ponów połączenie',
				backToDialpad: 'Wróć do klawiatury',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed:
				'Nie udało się nawiązać połączenia. Spróbuj ponownie.',
			holdToggleFailed:
				'Nie udało się wstrzymać ani wznowić połączenia. Spróbuj ponownie.',
			dtmfFailed: 'Nie udało się wysłać cyfry. Spróbuj ponownie.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Brak dostępu do mikrofonu. Nie można wykonać akcji.',
		},
	},
};
