import { ProcessingFieldComponent } from '../enums/ProcessingFieldComponent.enum';
import type { FormBodyElement } from '../types/ProcessingForm.types';
import { toNaiveUtcTimestamp } from './naiveUtcTimestamp';

// The backend expects form values as an object keyed by field id, not the body
// array. Display-only fields are dropped; select values are unwrapped to their
// primitive `value`; datetimepicker values are converted to naive UTC.
export function formattingFormBeforeSend(
	formBody: FormBodyElement[],
): Record<string, unknown> {
	return formBody.reduce<Record<string, unknown>>(
		(form, { id, value, view }) => {
			let normalized: unknown = value;

			if (view.component === 'form-text') return form;

			if (view.component === ProcessingFieldComponent.Select) {
				if (Array.isArray(value)) {
					normalized = value.map((item) =>
						item && typeof item === 'object'
							? (
									item as {
										value: unknown;
									}
								).value
							: item,
					);
				} else if (value && typeof value === 'object') {
					normalized = (
						value as {
							value: unknown;
						}
					).value;
				}
			}

			if (view.component === ProcessingFieldComponent.Datetimepicker) {
				normalized = toNaiveUtcTimestamp(value);
			}

			form[id] = normalized;
			return form;
		},
		{},
	);
}
