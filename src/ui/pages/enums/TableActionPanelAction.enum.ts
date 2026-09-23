export const TableActionPanelAction = {
	Refresh: 'refresh',
	ColumnSelect: 'columnSelect',
	Filter: 'filter',
} as const;

export type TableActionPanelAction =
	(typeof TableActionPanelAction)[keyof typeof TableActionPanelAction];
