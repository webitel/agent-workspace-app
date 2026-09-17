import type { DatalistTableHeader } from '@webitel/ui-datalist';
import { SortSymbols } from '@webitel/ui-sdk/src/scripts/sortQueryAdapters';

export const headers: DatalistTableHeader[] = [
	{
		value: 'name',
		locale: 'reusable.name',
		show: true,
		field: 'name',
		sort: SortSymbols.NONE,
	},
	{
		value: 'groups',
		locale: 'reusable.group',
		show: true,
		field: 'groups',
		width: '170px',
	},
	{
		value: 'phones',
		locale: [
			'vocabulary.phones',
			1,
		],
		show: true,
		field: 'phones',
	},
	{
		value: 'about',
		locale: 'vocabulary.description',
		show: true,
		field: 'about',
		sort: SortSymbols.NONE,
	},
];
