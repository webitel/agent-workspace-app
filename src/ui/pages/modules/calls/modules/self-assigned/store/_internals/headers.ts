import type { DatalistTableHeader } from '@webitel/ui-datalist';
import { SortSymbols } from '@webitel/ui-sdk/scripts/sortQueryAdapters';
import { WaitingCallSortField } from 'webitel-sdk';

// sortable `field`s are the SDK sort fields: the SDK sorts the list itself
export const headers: DatalistTableHeader[] = [
	{
		value: 'name',
		locale: 'reusable.name',
		show: true,
		field: WaitingCallSortField.Name,
		width: '256px',
		sort: SortSymbols.NONE,
	},
	{
		value: 'joinedAt',
		locale: 'reusable.dateTime',
		show: true,
		field: WaitingCallSortField.DateTime,
		width: '170px',
		sort: SortSymbols.NONE,
	},
	{
		value: 'wait',
		locale: 'ui.reusable.waitTime',
		show: true,
		field: WaitingCallSortField.Duration,
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
		field: WaitingCallSortField.Queue,
		width: '300px',
		sort: SortSymbols.NONE,
	},
	{
		value: 'phone',
		locale: 'ui.reusable.phoneNumber',
		show: true,
		field: 'displayNumber',
		width: '220px',
	},
];
