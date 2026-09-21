import type { DatalistTableHeader } from '@webitel/ui-datalist';

export const headers: DatalistTableHeader[] = [
	{
		value: 'name',
		locale: 'reusable.name',
		show: true,
		field: 'name',
		sort: null,
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
			2,
		],
		show: true,
		field: 'phones',
		sort: null,
	},
];
