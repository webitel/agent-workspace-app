import type { DatalistTableHeader } from '@webitel/ui-datalist';

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
	},
	{
		value: 'duration',
		locale: 'objects.totalDuration',
		show: true,
		field: 'duration',
		width: '140px',
	},
	{
		value: 'phone',
		locale: [
			'vocabulary.phones',
			1,
		],
		show: true,
		// virtual field, expanded to API fields in callsHistoryApiModule
		field: 'phone',
		width: '220px',
	},
	{
		value: 'metrics',
		locale: 'ui.pages.history.calls.table.mos',
		show: true,
		field: 'quality_metrics',
		width: '100px',
	},
];
