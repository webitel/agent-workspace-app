import { isEmpty } from '@webitel/ui-sdk/scripts';

import { ProcessingFieldComponent } from '../enums/ProcessingFieldComponent.enum';
import type {
	FormBodyElement,
	FormSelectOption,
	ProcessingFormData,
} from '../types/ProcessingForm.types';

// wt-select stores the selected option object; match the raw initialValue against
// the option list so the select shows the right label.
// https://webitel.atlassian.net/browse/WTEL-6742
function getSelectInitialValue(
	initialValue: unknown,
	options: FormSelectOption[] = [],
): unknown {
	return (
		options.find((option) => option.value === initialValue) ?? initialValue
	);
}

function getDatetimepickerInitialValue(
	initialValue: unknown,
	currentTime?: boolean,
): unknown {
	return currentTime || initialValue === 'now' ? Date.now() : initialValue;
}

function parseInitialValueToJson(initialValue: unknown): unknown {
	try {
		const parsed = JSON.parse(initialValue as string);

		// form-text may receive an object without keys — treat it as empty.
		// https://webitel.atlassian.net/browse/WTEL-6568
		if (parsed && typeof parsed === 'object') {
			return Object.keys(parsed).length ? parsed : null;
		}

		return parsed;
	} catch {
		return initialValue;
	}
}

function shouldInitComponent(element: FormBodyElement): boolean {
	return isEmpty(element.value) && Boolean(element.view.initialValue);
}

// Resolve the default value for a single field from its declared initialValue.
function resolveInitialValue(element: FormBodyElement): unknown {
	if (element.view.component === ProcessingFieldComponent.Select) {
		return getSelectInitialValue(
			element.view.initialValue,
			element.view.options,
		);
	}

	if (element.view.component === ProcessingFieldComponent.Datetimepicker) {
		return getDatetimepickerInitialValue(
			element.view.initialValue,
			element.view.currentTime,
		);
	}

	return parseInitialValueToJson(element.view.initialValue);
}

// Seed each field's value in place from its initialValue and mark the form
// initialized. Mutates the form (values live on the long-lived SDK Task).
export function initFormValues(form: ProcessingFormData): void {
	form.metadata = {}; // reset form metadata before init
	form.body.forEach((element) => {
		if (shouldInitComponent(element)) {
			element.value = resolveInitialValue(element);
		}
	});
	form.metadata.isInited = true;
}
