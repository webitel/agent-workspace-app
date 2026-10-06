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
		clientIdentity: {
			unknownContact: 'Unknown contact',
		},
		chatPreview: {
			onlyUnread: 'Show only unread chats',
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
			nothingToShowHere: 'Nothing to show here',
		},
		numpad: {
			call: 'Call',
		},
		processing: {
			postProcessing: {
				title: 'Post-processing',
				extend: 'Extend post-processing',
				extensionsLeft: 'Extensions left: {count}',
			},
		},
		variables: {
			empty: 'No variables',
			loadError: "Couldn't load the variables",
		},
		pages: {
			chats: {
				tabs: {
					chat: 'Chat',
					info: 'Info',
					postProcessing: 'Post-processing',
					interaction: 'Interaction',
					contact: 'Contact',
					iframe: 'Iframe',
				},
				topBar: {
					transfer: 'Transfer chat',
					end: 'End chat',
				},
			},
			history: {
				tabs: {
					calls: 'Calls',
				},
				calls: {
					table: {
						mos: 'MOS',
						phoneNumber: 'Phone number',
					},
					recordings: {
						unavailable: 'Recording unavailable',
						playAudio: 'Audio Recording',
						playVideo: 'Video Recording',
					},
					actions: {
						showCallInfo: 'Show info',
					},
					callInfo: {
						title: 'Information',
						postprocessing: 'Postprocessing',
						agentDescription: "Agent's comment",
					},
				},
			},
			tableActionPanel: {
				variableColumnSelect: {
					title: 'Select variables columns',
				},
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
