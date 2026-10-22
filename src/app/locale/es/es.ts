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
			onlyUnread: 'Solo chats no leídos',
		},
		chatList: {
			tabs: {
				active: 'Activos',
				snoozed: 'Pospuestos',
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
			nothingToShowHere: 'Aquí no hay nada que mostrar',
			startedAt: 'Iniciado',
			username: 'Nombre de usuario',
			message: 'Mensaje',
			phoneNumber: 'Número de teléfono',
		},
		numpad: {
			call: 'Llamar',
		},
		variables: {
			empty: 'Sin variables',
			loadError: 'No se pudieron cargar las variables',
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Perdidas',
				},
				tabs: {
					info: 'Información',
					postProcessing: 'Posprocesamiento',
					interaction: 'Interacción',
					contact: 'Contacto',
				},
			},
			chats: {
				pageTabs: {
					active: 'Activos',
				},
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
		call: {
			activeCall: {
				inCall: 'En llamada',
				onHold: 'En espera',
				actions: {
					numpad: 'Teclado',
					mute: 'Silenciar',
					hold: 'Poner en espera',
					transfer: 'Transferir',
					hangup: 'Finalizar llamada',
					openFullView: 'Abrir vista completa',
				},
			},
			outboundCall: {
				ringing: 'Sonando',
				noAnswer: 'Sin respuesta',
				noAnswerDescription:
					'El teléfono del destinatario no respondió a la llamada.',
				retryCall: 'Reintentar llamada',
				backToDialpad: 'Volver al teclado',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'No se pudo realizar la llamada. Inténtalo de nuevo.',
			holdToggleFailed:
				'No se pudo poner la llamada en espera ni reanudarla. Inténtalo de nuevo.',
			dtmfFailed: 'No se pudo enviar el dígito. Inténtalo de nuevo.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Acceso al micrófono denegado. No se puede realizar la acción.',
		},
	},
};
