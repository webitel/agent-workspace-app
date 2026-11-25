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
		locale: 'reusable.status',
		show: true,
		field: 'status',
	},
	{
		value: 'teamName',
		locale: 'objects.team',
		show: true,
		field: 'team',
	},
];
