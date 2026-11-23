export const TransferMode = {
	Blind: 'blind',
	Consult: 'consult',
} as const;
export type TransferMode = (typeof TransferMode)[keyof typeof TransferMode];
