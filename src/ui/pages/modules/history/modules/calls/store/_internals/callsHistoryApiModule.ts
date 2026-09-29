import { CallHistoryAPI } from '@webitel/api-services/api';
import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { normalizeDatetimeRange } from '@webitel/api-services/scripts';
import type { ApiModule } from '@webitel/ui-sdk/api/types/ApiModule';

import { useUserinfoStore } from '../../../../../../../../features/userinfo/stores/userinfoStore';

const DEFAULT_SORT = '-created_at';

/**
 * Backend rejects the list without a created_at range.
 * AC_19.01.24: default period starts on the 1st of the previous month.
 */
const getDefaultCreatedAtRange = () => {
	const now = new Date();
	return {
		from: new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime(),
		to: new Date(now).setHours(23, 59, 59, 999),
	};
};

/**
 * Header `field` values that are not backend fields: a column cell
 * needs several API fields to render
 */
const VIRTUAL_FIELDS: Record<string, string[]> = {
	name: [
		'contact',
		'from',
		'to',
		'destination',
		'direction',
		'answered_at',
	],
	phone: [
		'from',
		'to',
		'destination',
		'direction',
	],
};

/**
 * Fields not bound to any column but always needed by the table
 * (row actions: recordings player).
 */
const REQUIRED_FIELDS = [
	'files',
];

const toApiFields = (fields: string[] = []) => [
	...new Set(
		[
			...REQUIRED_FIELDS,
			...fields,
		].flatMap(
			(field) =>
				VIRTUAL_FIELDS[field] ?? [
					field,
				],
		),
	),
];

/**
 * Adapts datalist table store params to CallHistoryAPI:
 * CallHistoryAPI.getList does not convert keys, so wire params go in snake_case.
 */
const getList = async (params: Record<string, unknown> = {}) => {
	const { createdAt, sort, fields, parentId, ...rest } = params;

	const { userId } = useUserinfoStore();
	const createdAtRange = normalizeDatetimeRange(
		createdAt as Parameters<typeof normalizeDatetimeRange>[0],
	);
	const defaultCreatedAtRange = getDefaultCreatedAtRange();

	return CallHistoryAPI.getList({
		...rest,
		fields: toApiFields(fields as string[] | undefined),
		sort: sort || DEFAULT_SORT,
		'created_at.from': createdAtRange?.from ?? defaultCreatedAtRange.from,
		'created_at.to': createdAtRange?.to ?? defaultCreatedAtRange.to,
		owner_id: [
			userId,
		],
		options: {},
	});
};

export const callsHistoryApiModule = {
	getList,
} satisfies ApiModule<EngineHistoryCall>;
