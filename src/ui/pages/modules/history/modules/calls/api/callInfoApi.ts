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

const FILE_FIELDS = [
	'filesIncome',
	'filesOutcome',
];

const formatFieldValue = (key: string, value: string) => {
	if (!FILE_FIELDS.includes(key)) return value;
	try {
		const files: {
			name: string;
		}[] = JSON.parse(value);
		return files.map(({ name }) => name).join(', ');
	} catch {
		return value;
	}
};

const toFormFields = (formFields: Record<string, string> = {}) => {
	return Object.entries(formFields).map(([key, value]) => ({
		key,
		value: formatFieldValue(key, value),
	}));
};

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

	const [call] = items;
	if (!call) return;

	return {
		...call,
		forms: (call.forms ?? [])
			.map(({ form_fields, ...form }) => ({
				...form,
				fields: toFormFields(form_fields),
			}))
			.filter(({ fields }) => fields.length),
	};
};
