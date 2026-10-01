import type {
	EngineHistoryCall,
	EngineHistoryCallCallForm,
} from '@webitel/api-services/gen/models';

export interface CallInfoFormField {
	key: string;
	value: string;
}

export interface CallInfoForm extends EngineHistoryCallCallForm {
	fields: CallInfoFormField[];
}

export interface CallInfo extends Omit<EngineHistoryCall, 'forms'> {
	forms: CallInfoForm[];
}
