import type { DatalistTableHeader } from '@webitel/ui-datalist';

export const headers: DatalistTableHeader[] = [
	{
		value: 'name',
		locale: 'ui.pages.calls.missed.columns.name',
		field: 'contact.name',
		show: true,
		sort: null,
		width: '240px',
	},
	{
		value: 'phoneNumber',
		locale: 'ui.pages.calls.missed.columns.phoneNumber',
		field: 'destination',
		show: true,
		sort: null,
		width: '160px',
	},
	{
		value: 'createdAt',
		locale: 'ui.pages.calls.missed.columns.dateTime',
		field: 'created_at',
		show: true,
		sort: null,
		width: '180px',
	},
	{
		value: 'duration',
		locale: 'ui.pages.calls.missed.columns.totalDuration',
		field: 'duration',
		show: true,
		sort: null,
		width: '140px',
	},
	{
		value: 'queueName',
		locale: 'ui.pages.calls.missed.columns.queue',
		field: 'queue.name',
		show: true,
		sort: null,
		width: '160px',
	},
];
