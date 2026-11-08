import type { DatalistTableHeader } from '@webitel/ui-datalist';

export const transferAgentsHeaders: DatalistTableHeader[] = [
	{
		value: 'name',
		locale: 'ui.call.transfer.columns.name',
		show: true,
		field: 'name',
	},
	{
		value: 'status',
		locale: 'ui.call.transfer.columns.status',
		show: true,
		field: 'status',
	},
	{
		value: 'teamName',
		locale: 'ui.call.transfer.columns.team',
		show: true,
		field: 'team',
	},
];
