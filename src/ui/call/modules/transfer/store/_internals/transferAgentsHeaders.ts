import type { DatalistTableHeader } from '@webitel/ui-datalist';

import { TRANSFER_STATUS_COLUMN_WIDTH } from './transferStatusColumnWidth';

export const transferAgentsHeaders: DatalistTableHeader[] = [
	{
		value: 'name',
		locale: 'ui.call.transfer.columns.name',
		show: true,
		field: 'name',
	},
	{
		value: 'status',
		locale: 'ui.call.transfer.columns.status',
		show: true,
		field: 'status',
		width: TRANSFER_STATUS_COLUMN_WIDTH,
	},
	{
		value: 'teamName',
		locale: 'ui.call.transfer.columns.team',
		show: true,
		field: 'team',
	},
];
