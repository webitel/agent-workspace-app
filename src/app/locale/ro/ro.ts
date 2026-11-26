import { CallDirection, DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Vei primi apeluri doar din cozi',
			},
		},
		chatPreview: {
			onlyUnread: 'Doar conversațiile necitite',
		},
		chatList: {
			tabs: {
				active: 'Active',
				snoozed: 'Amânate',
			},
			snooze: {
				action: 'Amână',
				error: 'Chatul nu a putut fi amânat',
			},
		},
		notifications: {
			offer: {
				title: {
					call: 'Solicitare de apel primit',
					chat: 'Solicitare de chat primit',
				},
				channel: 'Canal',
				accept: 'Acceptă',
				decline: 'Respinge',
			},
			flows: {
				runFlowSuccess: 'Schema a fost lansată cu succes',
				runFlowError: 'Eroare la rularea schemei',
			},
		},
		reusable: {
			run: 'Rulează',
			nothingToShowHere: 'Nu există nimic de afișat aici',
			started: 'Început',
			startedAt: 'Început la',
			endedAt: 'Încheiat la',
			username: 'Nume utilizator',
			message: 'Mesaj',
			phoneNumber: 'Număr de telefon',
			waitTime: 'Timp de așteptare',
			select: 'Selectează',
			unknownContact: 'Contact necunoscut',
			info: 'Informații',
			interactions: 'Interacțiuni',
		},
		numpad: {
			call: 'Apelează',
		},
		processing: {
			postProcessing: {
				title: 'Post-procesare',
				extend: 'Prelungește post-procesarea',
				extensionsLeft: 'Prelungiri rămase: {count}',
			},
		},
		variables: {
			empty: 'Nu există variabile',
			loadError: 'Nu s-au putut încărca variabilele',
		},
		sidebar: {
			contact: {
				selectContact: {
					title: 'Selectați un contact',
					text: 'Alegeți o înregistrare din lista istoricului pentru a vedea detaliile contactului',
				},
				selectOrCreateContact: {
					title: 'Selectați un contact sau creați unul',
					text: 'Alegeți un contact din listă pentru a vedea detaliile acestuia sau creați unul nou.',
				},
				createContact: 'Creați un contact',
				addContacts: 'Adăugați contacte',
				profile: 'Profil',
				groups: 'Grupuri',
				attributes: 'Atribute',
				noAttributes: 'Nu sunt definite variabile personalizate',
				communicationOptions: 'Optiuni de comunicare',
				contactPosition: 'Contactul {current} din {count}',
				search: {
					title: 'Caută contact',
					noResults: 'Nu s-au găsit rezultate',
					modes: {
						name: 'Nume',
						destination: 'Număr sau e-mail',
						variables: 'Atribut',
					},
				},
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Pierdute',
					offline: 'Offline',
					selfAssigned: 'Auto-atribuite',
				},
				tabs: {
					iframe: 'iFrame',
				},
			},
			chats: {
				pageTabs: {
					closed: 'Închise',
				},
				tabs: {
					iframe: 'Iframe',
				},
				topBar: {
					pin: 'Fixează chatul',
					transfer: 'Transferă chatul',
					end: 'Încheie chatul',
				},
				closed: {
					notFound: 'Chatul nu a fost găsit',
					loadError: 'Chatul nu a putut fi încărcat',
					retry: 'Încearcă din nou',
					taskVariablesUnavailable:
						'Variabilele contact center nu sunt disponibile pentru chaturile închise',
				},
			},
			history: {
				tabs: {
					calls: 'Apeluri',
				},
				calls: {
					table: {
						mos: 'MOS',
					},
					recordings: {
						unavailable: 'Înregistrare indisponibilă',
						playAudio: 'Redă audio',
						playVideo: 'Redă video',
					},
					actions: {
						showCallInfo: 'Afișează informații',
					},
					callInfo: {
						title: 'Informații',
						agentDescription: 'Comentariul agentului',
					},
				},
			},
			contacts: {
				phones: {
					call: 'Apelează {number}',
					moreNumbers: '+{count} număr(e) în plus',
					noPhone: 'Fără telefon',
				},
				chats: {
					noChat: 'Fără chat',
				},
				emails: {
					noEmail: 'Fără e-mail',
				},
			},
		},
		call: {
			ringing: 'Sună',
			activeCall: {
				inCall: 'În apel',
				onHold: 'În așteptare',
				hungUp: 'Închis',
				actions: {
					numpad: 'Tastatură',
					mute: 'Dezactivează microfonul',
					hold: 'Pune în așteptare',
					camera: 'Cameră',
					transfer: 'Transferă',
					bridge: 'Conectează apelurile',
					hangup: 'Închide apelul',
					openFullView: 'Deschide vizualizarea completă',
				},
			},
			bridge: {
				title: 'Conectarea apelurilor',
				connect: 'Conectează',
			},
			transfer: {
				title: 'Transfer apel',
				emptyList: 'Nu s-a găsit nimic',
				columns: {
					name: 'Nume',
				},
				phoneLabel: 'Transfer la numărul',
				phonePlaceholder: 'Introduceți numărul de telefon',
				modes: {
					blind: 'Direct',
					consult: 'Cu consultare',
				},
			},
			outboundCall: {
				noAnswer: 'Niciun răspuns',
				noAnswerDescription: 'Telefonul destinatarului nu a răspuns la apel.',
				retryCall: 'Reîncearcă apelul',
				backToDialpad: 'Înapoi la tastatură',
			},
			direction: {
				[CallDirection.Inbound]: 'Apel de intrare',
				[CallDirection.Outbound]: 'Apel de ieșire',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'Apelul nu a putut fi efectuat. Încearcă din nou.',
			holdToggleFailed:
				'Apelul nu a putut fi pus în așteptare sau reluat. Încearcă din nou.',
			dtmfFailed: 'Cifra nu a putut fi trimisă. Încearcă din nou.',
			transferFailed: 'Apelul nu a putut fi transferat. Încearcă din nou.',
			bridgeFailed: 'Apelurile nu au putut fi conectate. Încearcă din nou.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Accesul la microfon este refuzat. Acțiunea nu poate fi efectuată.',
		},
	},
};
