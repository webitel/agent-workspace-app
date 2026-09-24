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
		numpad: {
			placeholder: 'Enter phone number',
			call: 'Call',
		},
		dialer: {
			outboundCall: {
				ringing: 'Ringing',
				noAnswer: 'No answer',
				noAnswerDescription:
					"The recipient's phone did not answer the request.",
				retryCall: 'Retry call',
				backToDialpad: 'Back to dialpad',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'The call could not be placed. Please try again.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Microphone access is denied. Cannot perform action.',
		},
	},
};
