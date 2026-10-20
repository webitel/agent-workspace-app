import type { DatalistTableHeader } from '@webitel/ui-datalist';
import { SortSymbols } from '@webitel/ui-sdk/scripts/sortQueryAdapters';

export const headers: DatalistTableHeader[] = [
	{
		value: 'name',
		locale: 'reusable.name',
		show: true,
		// virtual field, expanded to API fields in callsHistoryApiModule
		field: 'name',
		width: '256px',
	},
	{
		value: 'createdAt',
		locale: 'reusable.dateTime',
		show: true,
		field: 'created_at',
		width: '170px',
		sort: SortSymbols.NONE,
	},
	{
		value: 'duration',
		locale: 'objects.totalDuration',
		show: true,
		field: 'duration',
		width: '140px',
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
		// virtual field, expanded to API fields in callsHistoryApiModule
		field: 'phone',
		width: '220px',
	},
];
