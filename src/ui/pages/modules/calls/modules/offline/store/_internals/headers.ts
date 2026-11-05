import type { DatalistTableHeader } from '@webitel/ui-datalist';
import { SortSymbols } from '@webitel/ui-sdk/scripts/sortQueryAdapters';

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
		value: 'queue',
		locale: [
			'objects.queue.queue',
			1,
		],
		show: true,
		field: 'queue',
		width: '300px',
		sort: SortSymbols.NONE,
	},
	{
		value: 'phone',
		locale: 'ui.reusable.phoneNumber',
		show: true,
		field: 'communications',
		width: '220px',
	},
];
