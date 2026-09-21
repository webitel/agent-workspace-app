export const WsTableActionPanelAction = {
	Refresh: 'refresh',
	ColumnSelect: 'columnSelect',
	Filter: 'filter',
} as const;

export type WsTableActionPanelAction =
	(typeof WsTableActionPanelAction)[keyof typeof WsTableActionPanelAction];
