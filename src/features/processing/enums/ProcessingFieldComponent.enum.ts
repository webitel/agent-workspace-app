// Raw backend `view.component` names the renderer knows how to render.
export const ProcessingFieldComponent = {
	Select: 'wt-select',
	InputText: 'wt-input',
	Datetimepicker: 'wt-datetimepicker',
} as const;

export type ProcessingFieldComponent =
	(typeof ProcessingFieldComponent)[keyof typeof ProcessingFieldComponent];
