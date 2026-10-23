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
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Pierdute',
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
					transfer: 'Transferă',
					hangup: 'Închide apelul',
					openFullView: 'Deschide vizualizarea completă',
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
