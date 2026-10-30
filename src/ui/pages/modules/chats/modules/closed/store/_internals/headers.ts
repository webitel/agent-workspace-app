import type { DatalistTableHeader } from '@webitel/ui-datalist';
import { SortSymbols } from '@webitel/ui-sdk/scripts/sortQueryAdapters';

// sortable only where the left threads endpoint sorts: source and queue, by name
export const headers: DatalistTableHeader[] = [
	{
		value: 'name',
		locale: 'reusable.name',
		show: true,
		field: 'name',
	},
	{
		value: 'source',
		locale: 'cases.source',
		show: true,
		field: 'channel_name',
		sort: SortSymbols.NONE,
	},
	{
		value: 'queue',
		locale: [
			'objects.queue.queue',
			1,
		],
		show: true,
		field: 'queue_name',
		sort: SortSymbols.NONE,
	},
	{
		value: 'startedAt',
		locale: 'ui.reusable.startedAt',
		show: true,
		field: 'started_at',
	},
	{
		value: 'endedAt',
		locale: 'ui.reusable.endedAt',
		show: true,
		field: 'ended_at',
	},
	{
		value: 'username',
		locale: 'ui.reusable.username',
		show: true,
		field: 'username',
	},
	{
		value: 'message',
		locale: 'ui.reusable.message',
		show: true,
		field: 'message',
	},
	{
		value: 'duration',
		locale: 'vocabulary.duration',
		show: true,
		field: 'duration',
	},
];
