import { CallHistoryAPI } from '@webitel/api-services/api';
import type { CallInfo } from '../types/CallInfo.types';

const CALL_INFO_FIELDS = [
	'id',
	'variables',
	'forms',
	'agent_description',
	'files',
	'files_job',
	'transcripts',
];

const DO_NOT_CONVERT_KEYS = [
	'variables',
	'form_fields',
];

export const getCallInfo = async (
	id: string,
): Promise<CallInfo | undefined> => {
	const { items = [] } = await CallHistoryAPI.getListPost({
		data: {
			id: [
				id,
			],
			fields: CALL_INFO_FIELDS,
			createdAt: {
				from: 0,
			},
			size: 1,
		},
		doNotConvertKeys: DO_NOT_CONVERT_KEYS,
	});
	return items[0];
};
