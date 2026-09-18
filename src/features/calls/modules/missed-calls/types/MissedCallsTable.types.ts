export type MissedCallsSortOrder = 'asc' | 'desc' | null;

export const MISSED_CALLS_SORT = {
	ASC: 'asc',
	DESC: 'desc',
	NONE: null,
} as const satisfies Record<string, MissedCallsSortOrder>;

export type MissedCallsColumnHeader = {
	value: string;
	locale?: string | (string | number | Record<string, unknown>)[];
	text?: string;
	width?: string;
	field?: string;
	sort?: MissedCallsSortOrder | boolean;
	show?: boolean;
	reorderable?: boolean;
};
