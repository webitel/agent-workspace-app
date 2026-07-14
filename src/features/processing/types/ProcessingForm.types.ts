// Runtime shape of a processing form. The webitel-sdk `Form` type is looser
// (`view: object`, `actions: object[]`) than what the backend actually sends, so
// we model the concrete shape the renderer relies on here.

export interface FormSelectOption {
	value: unknown;
	[key: string]: unknown;
}

export interface FormFieldView {
	// raw component name from the backend, e.g. 'wt-select', 'wt-input'
	component: string;
	hint?: string;
	initialValue?: string | unknown[];
	options?: FormSelectOption[];
	currentTime?: boolean;
	[key: string]: unknown;
}

export interface FormBodyElement {
	id: string;
	value: unknown;
	view: FormFieldView;
}

export interface FormActionView {
	color?: string;
	text?: string;
	id?: string;
}

export interface ProcessingFormAction {
	id: string;
	view: FormActionView;
}

export interface ProcessingFormMetadata {
	isInited?: boolean;
	[key: string]: unknown;
}

export interface ProcessingFormData {
	title?: string;
	body: FormBodyElement[];
	actions: ProcessingFormAction[];
	metadata: ProcessingFormMetadata;
	fields?: Record<string, unknown>;
}
