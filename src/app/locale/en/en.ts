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
		chatList: {
			tabs: {
				active: 'Active',
				snoozed: 'Snoozed',
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
			nothingToShowHere: 'Nothing to show here',
			startedAt: 'Started at',
			username: 'Username',
			message: 'Message',
			phoneNumber: 'Phone number',
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
		sidebar: {
			contact: {
				selectContact: {
					title: 'Select a contact',
					text: "Choose a record from the history list to view the contact's details",
				},
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Missed',
				},
				tabs: {
					info: 'Info',
					postProcessing: 'Post-processing',
					interaction: 'Interaction',
					contact: 'Contact',
				},
			},
			chats: {
				pageTabs: {
					active: 'Active',
				},
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
		call: {
			activeCall: {
				inCall: 'In call',
				onHold: 'On hold',
				actions: {
					numpad: 'Numpad',
					mute: 'Mute',
					hold: 'Hold',
					camera: 'Camera',
					message: 'Message',
					transfer: 'Transfer',
					hangup: 'End call',
					openFullView: 'Open full view',
				},
			},
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
			holdToggleFailed:
				'The call could not be put on hold or resumed. Please try again.',
			dtmfFailed: 'The digit could not be sent. Please try again.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Microphone access is denied. Cannot perform action.',
		},
	},
};
