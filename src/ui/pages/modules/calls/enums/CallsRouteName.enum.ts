// src/ui/pages/modules/calls/enums/CallsRouteName.enum.ts
export const CallsRouteName = {
	CallWindow: 'call-window',
} as const;

export type CallsRouteName =
	(typeof CallsRouteName)[keyof typeof CallsRouteName];
