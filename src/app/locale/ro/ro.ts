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
			incoming: {
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
		},
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Accesul la microfon este refuzat. Acțiunea nu poate fi efectuată.',
		},
	},
};
