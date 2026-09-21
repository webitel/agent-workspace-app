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
		pages: {
			calls: {
				tabs: {
					missed: 'Perdidas',
				},
				missed: {
					title: 'Llamadas perdidas',
					columns: {
						name: 'Nombre',
						phoneNumber: 'Número de teléfono',
						dateTime: 'Fecha y hora',
						totalDuration: 'Duración total',
						queue: 'Cola',
					},
					search: {
						tooltip: 'Buscar',
						placeholder: 'Buscar por nombre o número de teléfono',
					},
					actions: {
						openContact: 'Abrir contacto',
						call: 'Llamar',
					},
				},
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
