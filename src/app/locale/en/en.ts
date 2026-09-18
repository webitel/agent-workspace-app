import { DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'You will receive calls from queues only',
			},
		},
		notifications: {
			incoming: {
				title: {
					call: 'Incoming call request',
					chat: 'Incoming chat request',
				},
				unknownContact: 'Unknown contact',
				queue: 'Queue',
				channel: 'Channel',
				waitingTime: 'Waiting time',
				accept: 'Accept',
				decline: 'Decline',
			},
		},
		pages: {
			calls: {
				tabs: {
					missed: 'Missed',
				},
				missed: {
					title: 'Missed calls',
					columns: {
						name: 'Name',
						phoneNumber: 'Phone number',
						dateTime: 'Date & time',
						totalDuration: 'Total duration',
						queue: 'Queue',
					},
					search: {
						tooltip: 'Search',
						placeholder: 'Search by name or phone number',
					},
					actions: {
						openContact: 'Open contact',
						call: 'Call',
					},
				},
			},
		},
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Microphone access is denied. Cannot perform action.',
		},
	},
};
