import { CallHistoryAPI } from '@webitel/api-services/api';
import { applyTransform } from '@webitel/api-services/api/transformers';
import type {
	EngineHistoryCall,
	EngineHistoryCallCallForm,
} from '@webitel/api-services/gen/models';
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

type RawCallInfoForm = EngineHistoryCallCallForm & {
	form_fields?: Record<string, string>;
};

type RawCallInfo = Omit<EngineHistoryCall, 'forms'> & {
	forms?: RawCallInfoForm[];
};

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

const formsTransformer = ({ forms = [], ...call }: RawCallInfo): CallInfo => ({
	...call,
	forms: forms
		.map(({ form_fields, ...form }) => ({
			...form,
			fields: toFormFields(form_fields),
		}))
		.filter(({ fields }) => fields.length),
});

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

	return applyTransform<CallInfo>(call, [
		formsTransformer,
	]);
};
