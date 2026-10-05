export const TableActionPanelAction = {
	Refresh: 'refresh',
	ColumnSelect: 'columnSelect',
	VariableColumnSelect: 'variableColumnSelect',
	Filter: 'filter',
} as const;

export type TableActionPanelAction =
	(typeof TableActionPanelAction)[keyof typeof TableActionPanelAction];
