import type { WtTableHeader } from '@webitel/ui-sdk/components/wt-table/types/WtTable';
import { SortSymbols } from '@webitel/ui-sdk/scripts';

import { ActiveChatsColumn } from '../../enums/ActiveChatsColumn.enum';

// `field` is what wt-table matches a column by when it is sorted, resized or
// reordered; there is no API behind it, so it repeats `value`
const column = (
	value: ActiveChatsColumn,
	locale: WtTableHeader['locale'],
): WtTableHeader => ({
	value,
	field: value,
	locale,
	show: true,
});

/**
 * Columns in the order of the design (US_02.06, AC_02.06.01), oldest Started at
 * first by default.
 */
export const headers: WtTableHeader[] = [
	column(ActiveChatsColumn.Name, 'reusable.name'),
	column(ActiveChatsColumn.Source, 'ui.pages.chats.active.table.source'),
	column(ActiveChatsColumn.Queue, [
		'objects.queue.queue',
		1,
	]),
	{
		...column(
			ActiveChatsColumn.StartedAt,
			'ui.pages.chats.active.table.startedAt',
		),
		sort: SortSymbols.ASC,
	},
	column(ActiveChatsColumn.Username, 'ui.pages.chats.active.table.username'),
	column(ActiveChatsColumn.Message, 'ui.pages.chats.active.table.message'),
	column(ActiveChatsColumn.Duration, 'vocabulary.duration'),
];
