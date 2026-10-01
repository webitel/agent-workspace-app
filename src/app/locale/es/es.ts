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
			flows: {
				runFlowSuccess: 'Esquema lanzado con éxito',
				runFlowError: 'Error al ejecutar el esquema',
			},
		},
		reusable: {
			run: 'Ejecutar',
		},
		numpad: {
			call: 'Llamar',
		},
		pages: {
			chats: {
				tabs: {
					chat: 'Chat',
					info: 'Información',
					postProcessing: 'Posprocesamiento',
					interaction: 'Interacción',
					contact: 'Contacto',
					iframe: 'Iframe',
				},
				info: {
					empty: 'Sin variables',
					loadError: 'No se pudieron cargar las variables del chat',
				},
			},
			history: {
				tabs: {
					calls: 'Llamadas',
				},
				calls: {
					table: {
						mos: 'MOS',
					},
					recordings: {
						unavailable: 'Grabación no disponible',
						playAudio: 'Reproducir audio',
						playVideo: 'Reproducir vídeo',
					},
					actions: {
						showCallInfo: 'Mostrar información de la llamada',
					},
					callInfo: {
						title: 'Información de la llamada',
						postprocessing: 'Posprocesamiento',
						agentDescription: 'Comentario del agente',
					},
				},
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'No se pudo realizar la llamada. Inténtalo de nuevo.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Acceso al micrófono denegado. No se puede realizar la acción.',
		},
	},
};
