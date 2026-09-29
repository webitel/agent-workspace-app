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
		dialer: {
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
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Accesul la microfon este refuzat. Acțiunea nu poate fi efectuată.',
		},
	},
};
