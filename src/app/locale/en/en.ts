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
			offer: {
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
			flows: {
				runFlowSuccess: 'Schema launched successfully',
				runFlowError: 'Failed to run the schema',
			},
		},
		reusable: {
			run: 'Run',
		},
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Microphone access is denied. Cannot perform action.',
		},
	},
};
