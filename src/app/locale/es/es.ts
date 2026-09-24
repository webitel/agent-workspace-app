import { DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Recibirás llamadas solo de las colas',
			},
		},
		notifications: {
			offer: {
				title: {
					call: 'Llamada entrante',
					chat: 'Chat entrante',
				},
				unknownContact: 'Contacto desconocido',
				queue: 'Cola',
				channel: 'Canal',
				waitingTime: 'Tiempo de espera',
				accept: 'Aceptar',
				decline: 'Rechazar',
			},
		},
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Acceso al micrófono denegado. No se puede realizar la acción.',
		},
	},
};
