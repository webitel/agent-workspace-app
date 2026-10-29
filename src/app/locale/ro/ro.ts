import { DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Vei primi apeluri doar din cozi',
			},
		},
		clientIdentity: {
			unknownContact: 'Contact necunoscut',
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
					call: 'Apel primit',
					chat: 'Chat primit',
				},
				unknownContact: 'Contact necunoscut',
				queue: 'Coadă',
				channel: 'Canal',
				waitingTime: 'Timp de așteptare',
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
			startedAt: 'Început la',
			username: 'Nume utilizator',
			message: 'Mesaj',
			phoneNumber: 'Număr de telefon',
		},
		numpad: {
			call: 'Apelează',
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
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Pierdute',
				},
				tabs: {
					info: 'Informații',
					postProcessing: 'Post-procesare',
					interaction: 'Interacțiuni',
					screenshots: 'Capturi de ecran',
					contact: 'Contact',
					iframe: 'iFrame',
				},
			},
			chats: {
				pageTabs: {
					active: 'Active',
				},
				tabs: {
					chat: 'Chat',
					info: 'Informații',
					postProcessing: 'Post-procesare',
					interaction: 'Interacțiune',
					contact: 'Contact',
					iframe: 'Iframe',
				},
				topBar: {
					pin: 'Fixează chatul',
					transfer: 'Transferă chatul',
					end: 'Încheie chatul',
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
						postprocessing: 'Postprocesare',
						agentDescription: 'Comentariul agentului',
					},
				},
			},
			tableActionPanel: {
				variableColumnSelect: {
					title: 'Selectează coloanele variabile',
				},
			},
		},
		call: {
			activeCall: {
				inCall: 'În apel',
				onHold: 'În așteptare',
				actions: {
					numpad: 'Tastatură',
					mute: 'Dezactivează microfonul',
					hold: 'Pune în așteptare',
					camera: 'Cameră',
					message: 'Mesaj',
					transfer: 'Transferă',
					hangup: 'Închide apelul',
					openFullView: 'Deschide vizualizarea completă',
				},
			},
			transfer: {
				title: 'Transfer apel',
				numberLabel: 'Transfer la numărul',
				numberPlaceholder: 'Introduceți numărul de telefon',
				modes: {
					blind: 'Direct',
					consult: 'Cu consultare',
				},
			},
			outboundCall: {
				ringing: 'Sună',
				noAnswer: 'Niciun răspuns',
				noAnswerDescription: 'Telefonul destinatarului nu a răspuns la apel.',
				retryCall: 'Reîncearcă apelul',
				backToDialpad: 'Înapoi la tastatură',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'Apelul nu a putut fi efectuat. Încearcă din nou.',
			holdToggleFailed:
				'Apelul nu a putut fi pus în așteptare sau reluat. Încearcă din nou.',
			dtmfFailed: 'Cifra nu a putut fi trimisă. Încearcă din nou.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Accesul la microfon este refuzat. Acțiunea nu poate fi efectuată.',
		},
	},
};
