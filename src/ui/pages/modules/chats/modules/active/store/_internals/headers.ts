import type { DatalistTableHeader } from '@webitel/ui-datalist';
import { SortSymbols } from '@webitel/ui-sdk/scripts/sortQueryAdapters';

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
		locale: 'ui.pages.chats.active.startedAt',
		show: true,
		field: 'created_at',
		sort: SortSymbols.ASC,
	},
	{
		value: 'username',
		locale: 'ui.pages.chats.active.username',
		show: true,
		field: 'username',
	},
	{
		value: 'message',
		locale: 'ui.pages.chats.active.message',
		show: true,
		field: 'message',
	},
	{
		value: 'duration',
		locale: 'vocabulary.duration',
		show: true,
		field: 'duration',
		sort: SortSymbols.NONE,
	},
];
