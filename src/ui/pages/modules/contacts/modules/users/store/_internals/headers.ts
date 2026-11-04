import type { DatalistTableHeader } from '@webitel/ui-datalist';
import { SortSymbols } from '@webitel/ui-sdk/scripts';

export const headers: DatalistTableHeader[] = [
	{
		value: 'name',
		locale: 'reusable.name',
		show: true,
		field: 'name',
		width: '256px',
		sort: SortSymbols.NONE,
	},
	{
		value: 'status',
		locale: 'reusable.status',
		show: true,
		width: '150px',
		field: 'status',
	},
	{
		value: 'team',
		locale: 'objects.team',
		show: true,
		field: 'team',
		width: '300px',
		sort: SortSymbols.NONE,
	},
	{
		value: 'extension',
		locale: [
			'ui.reusable.phoneNumber',
			1,
		],
		show: true,
		field: 'extension',
		width: '220px',
	},
];
