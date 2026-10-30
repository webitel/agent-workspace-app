export const WorkspaceState = {
	CALL = 'call',
	MEMBER = 'member',
	CHAT = 'chat',
	JOB = 'job',
} as const;

export type WorkspaceState =
	(typeof WorkspaceState)[keyof typeof WorkspaceState];
