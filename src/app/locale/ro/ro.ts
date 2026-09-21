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
		},
		pages: {
			calls: {
				tabs: {
					missed: 'Pierdute',
				},
				missed: {
					title: 'Apeluri pierdute',
					columns: {
						name: 'Nume',
						phoneNumber: 'Număr de telefon',
						dateTime: 'Data și ora',
						totalDuration: 'Durata totală',
						queue: 'Coadă',
					},
					search: {
						tooltip: 'Căutare',
						placeholder: 'Căutare după nume sau număr de telefon',
					},
					actions: {
						openContact: 'Deschide contactul',
						call: 'Sună',
					},
				},
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
