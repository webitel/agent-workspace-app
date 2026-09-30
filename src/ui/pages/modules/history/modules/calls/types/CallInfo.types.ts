import type {
	EngineHistoryCall,
	EngineHistoryCallCallForm,
} from '@webitel/api-services/gen/models';

/**
 * `form_fields` is returned by backend but missing in the generated model;
 * it stays in snake_case because of `doNotConvertKeys` in callInfoApi
 */
export interface CallInfoForm extends EngineHistoryCallCallForm {
	form_fields?: Record<string, string>;
}

export interface CallInfo extends Omit<EngineHistoryCall, 'forms'> {
	forms?: CallInfoForm[];
}
