import { DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Będziesz otrzymywać połączenia tylko z kolejek',
			},
		},
		notifications: {
			offer: {
				title: {
					call: 'Połączenie przychodzące',
					chat: 'Czat przychodzący',
				},
				unknownContact: 'Nieznany kontakt',
				queue: 'Kolejka',
				channel: 'Kanał',
				waitingTime: 'Czas oczekiwania',
				accept: 'Odbierz',
				decline: 'Odrzuć',
			},
			flows: {
				runFlowSuccess: 'Schemat uruchomiony pomyślnie',
				runFlowError: 'Nie udało się uruchomić schematu',
			},
		},
		reusable: {
			run: 'Uruchom',
		},
		numpad: {
			call: 'Zadzwoń',
		},
		dialer: {
			outboundCall: {
				ringing: 'Dzwonienie',
				noAnswer: 'Brak odpowiedzi',
				noAnswerDescription: 'Telefon odbiorcy nie odpowiedział na połączenie.',
				retryCall: 'Ponów połączenie',
				backToDialpad: 'Wróć do klawiatury',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed:
				'Nie udało się nawiązać połączenia. Spróbuj ponownie.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Brak dostępu do mikrofonu. Nie można wykonać akcji.',
		},
	},
};
