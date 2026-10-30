import type { DatalistTableHeader } from '@webitel/ui-datalist';

// no `sort` on any header: the left threads endpoint is not sortable from here
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
		field: 'source',
	},
	{
		value: 'queue',
		locale: [
			'objects.queue.queue',
			1,
		],
		show: true,
		field: 'queue',
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
