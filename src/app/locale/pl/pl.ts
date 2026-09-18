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
			incoming: {
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
		},
		pages: {
			calls: {
				tabs: {
					missed: 'Nieodebrane',
				},
				missed: {
					title: 'Nieodebrane połączenia',
					columns: {
						name: 'Imię',
						phoneNumber: 'Numer telefonu',
						dateTime: 'Data i godzina',
						totalDuration: 'Całkowity czas trwania',
						queue: 'Kolejka',
					},
					search: {
						tooltip: 'Szukaj',
						placeholder: 'Szukaj według imienia lub numeru telefonu',
					},
					actions: {
						openContact: 'Otwórz kontakt',
						call: 'Zadzwoń',
					},
				},
			},
		},
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Brak dostępu do mikrofonu. Nie można wykonać akcji.',
		},
	},
};
