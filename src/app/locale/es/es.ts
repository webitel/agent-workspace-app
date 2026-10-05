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
		clientIdentity: {
			unknownContact: 'Contacto desconocido',
		},
		chatPreview: {
			queue: 'Cola',
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
		variables: {
			empty: 'Sin variables',
			loadError: 'No se pudieron cargar las variables',
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
			},
			history: {
				tabs: {
					calls: 'Llamadas',
				},
				calls: {
					table: {
						mos: 'MOS',
						phoneNumber: 'Número de teléfono',
					},
					recordings: {
						unavailable: 'Grabación no disponible',
						playAudio: 'Reproducir audio',
						playVideo: 'Reproducir vídeo',
					},
					actions: {
						showCallInfo: 'Mostrar información',
					},
					callInfo: {
						title: 'Información',
						postprocessing: 'Posprocesamiento',
						agentDescription: 'Comentario del agente',
					},
				},
			},
			tableActionPanel: {
				variableColumnSelect: {
					title: 'Seleccionar columnas de variables',
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
