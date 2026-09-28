// Raw backend `view.component` names the renderer knows how to render.
export const ProcessingFieldComponent = {
	Select: 'wt-select',
	InputText: 'wt-input',
	Datetimepicker: 'wt-datetimepicker',
	Text: 'form-text',
	CaseStatus: 'form-select-case-status',
	SelectFromObject: 'form-select-from-object',
	IFrame: 'form-i-frame',
	File: 'form-file',
	Table: 'form-table',
} as const;

export type ProcessingFieldComponent =
	(typeof ProcessingFieldComponent)[keyof typeof ProcessingFieldComponent];
