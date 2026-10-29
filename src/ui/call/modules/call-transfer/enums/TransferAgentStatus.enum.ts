export const TransferAgentStatus = {
	Online: 'online',
	Pause: 'pause',
	BreakOut: 'break_out',
	Offline: 'offline',
	Dnd: 'dnd',
} as const;
export type TransferAgentStatus =
	(typeof TransferAgentStatus)[keyof typeof TransferAgentStatus];
