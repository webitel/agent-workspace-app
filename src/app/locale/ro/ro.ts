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
		},
		numpad: {
			call: 'Apelează',
		},
		variables: {
			empty: 'Nu există variabile',
			loadError: 'Nu s-au putut încărca variabilele',
		},
		pages: {
			chats: {
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
						title: 'Informații despre apel',
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
	},
	error: {
		calls: {
			outboundCallFailed: 'Apelul nu a putut fi efectuat. Încearcă din nou.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Accesul la microfon este refuzat. Acțiunea nu poate fi efectuată.',
		},
	},
};
