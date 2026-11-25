import { CallDirection, DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Będziesz otrzymywać połączenia tylko z kolejek',
			},
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
					call: 'Żądanie połączenia przychodzącego',
					chat: 'Żądanie czatu przychodzącego',
				},
				channel: 'Kanał',
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
			started: 'Rozpoczęto',
			startedAt: 'Czas rozpoczęcia',
			endedAt: 'Czas zakończenia',
			username: 'Nazwa użytkownika',
			message: 'Wiadomość',
			phoneNumber: 'Numer telefonu',
			waitTime: 'Czas oczekiwania',
			select: 'Wybierz',
			unknownContact: 'Nieznany kontakt',
			info: 'Informacje',
			interactions: 'Interakcje',
		},
		numpad: {
			call: 'Zadzwoń',
		},
		processing: {
			postProcessing: {
				title: 'Przetwarzanie końcowe',
				extend: 'Przedłuż przetwarzanie końcowe',
				extensionsLeft: 'Pozostałe przedłużenia: {count}',
			},
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
				groups: 'Grupy',
				attributes: 'Atrybuty',
				noAttributes: 'Brak zdefiniowanych zmiennych niestandardowych',
				communicationOptions: 'Opcje komunikacji',
				contactPosition: '{current} z {count} kontaktów',
				search: {
					title: 'Szukaj kontaktu',
					noResults: 'Nie znaleziono wyników',
					modes: {
						name: 'Nazwa',
						destination: 'Numer lub e-mail',
						variables: 'Atrybut',
					},
				},
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Nieodebrane',
					offline: 'Offline',
					selfAssigned: 'Ręcznie przypisane',
				},
				tabs: {
					iframe: 'iFrame',
				},
			},
			chats: {
				pageTabs: {
					closed: 'Zamknięte',
				},
				tabs: {
					iframe: 'Iframe',
				},
				topBar: {
					pin: 'Przypnij czat',
					transfer: 'Przekieruj czat',
					end: 'Zakończ czat',
				},
				closed: {
					notFound: 'Nie znaleziono czatu',
					loadError: 'Nie udało się załadować czatu',
					retry: 'Spróbuj ponownie',
					taskVariablesUnavailable:
						'Zmienne contact center są niedostępne dla zamkniętych czatów',
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
						agentDescription: 'Komentarz agenta',
					},
				},
			},
			contacts: {
				phones: {
					call: 'Zadzwoń na {number}',
					moreNumbers: '+{count} numer(ów) więcej',
					noPhone: 'Brak telefonu',
				},
				chats: {
					noChat: 'Brak czatu',
				},
				emails: {
					noEmail: 'Brak e-maila',
				},
			},
		},
		call: {
			ringing: 'Dzwonienie',
			activeCall: {
				inCall: 'W rozmowie',
				onHold: 'Wstrzymane',
				hungUp: 'Rozłączono',
				actions: {
					numpad: 'Klawiatura',
					mute: 'Wycisz',
					hold: 'Wstrzymaj',
					camera: 'Kamera',
					transfer: 'Przekieruj',
					bridge: 'Połącz rozmowy',
					hangup: 'Zakończ połączenie',
					openFullView: 'Otwórz pełny widok',
				},
			},
			bridge: {
				title: 'Łączenie rozmów',
				connect: 'Połącz',
			},
			transfer: {
				title: 'Przekieruj połączenie',
				emptyList: 'Nic nie znaleziono',
				columns: {
					name: 'Nazwa',
				},
				phoneLabel: 'Przekieruj na numer',
				phonePlaceholder: 'Wpisz numer telefonu',
				modes: {
					blind: 'Bez konsultacji',
					consult: 'Z konsultacją',
				},
			},
			outboundCall: {
				noAnswer: 'Brak odpowiedzi',
				noAnswerDescription: 'Telefon odbiorcy nie odpowiedział na połączenie.',
				retryCall: 'Ponów połączenie',
				backToDialpad: 'Wróć do klawiatury',
			},
			direction: {
				[CallDirection.Inbound]: 'Połączenie przychodzące',
				[CallDirection.Outbound]: 'Połączenie wychodzące',
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
			transferFailed:
				'Nie udało się przekierować połączenia. Spróbuj ponownie.',
			bridgeFailed: 'Nie udało się połączyć rozmów. Spróbuj ponownie.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Brak dostępu do mikrofonu. Nie można wykonać akcji.',
		},
	},
};
