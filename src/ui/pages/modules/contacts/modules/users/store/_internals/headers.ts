import type { DatalistTableHeader } from '@webitel/ui-datalist';
import { SortSymbols } from '@webitel/ui-sdk/scripts/sortQueryAdapters';

export const headers: DatalistTableHeader[] = [
	{
		value: 'name',
		locale: 'reusable.name',
		show: true,
		field: 'name',
		sort: SortSymbols.NONE,
	},
	{
		value: 'presence',
		locale: 'reusable.status',
		show: true,
		field: 'presence',
	},
	// TODO: uncomment when UsersAPI starts returning team (now the backend rejects the "team" field)
	// {
	// 	value: 'team',
	// 	locale: 'objects.team',
	// 	show: true,
	// 	field: 'team',
	// 	sort: SortSymbols.NONE,
	// },
	{
		value: 'extension',
		locale: [
			'vocabulary.phones',
			1,
		],
		show: true,
		field: 'extension',
	},
];
