export const TransferTab = {
	Agents: 'agents',
	Queues: 'queues',
	Users: 'users',
	Dialplans: 'dialplans',
} as const;
export type TransferTab = (typeof TransferTab)[keyof typeof TransferTab];
