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
		value: 'groups',
		locale: 'reusable.group',
		show: true,
		field: 'groups',
		width: '300px',
		sort: SortSymbols.NONE,
	},
	{
		value: 'phones',
		locale: [
			'ui.reusable.phoneNumber',
			2,
		],
		show: true,
		field: 'phones',
		width: '220px',
	},
	{
		value: 'imclients',
		locale: [
			'objects.chat.chat',
			1,
		],
		show: true,
		field: 'imclients',
		width: '220px',
	},
	{
		value: 'emails',
		locale: [
			'vocabulary.emails',
			1,
		],
		show: true,
		field: 'emails',
		width: '220px',
	},
];
