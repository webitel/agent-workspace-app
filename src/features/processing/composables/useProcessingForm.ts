import { computed, type MaybeRefOrGetter, toValue, watch } from 'vue';
import type { Task } from 'webitel-sdk';

import { ProcessingFieldComponent } from '../enums/ProcessingFieldComponent.enum';
import type {
	FormBodyElement,
	FormSelectOption,
	ProcessingFormAction,
	ProcessingFormData,
} from '../types/ProcessingForm.types';
import { formattingFormBeforeSend } from '../utils/formattingFormBeforeSend';

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

// Falsy, including empty arrays/objects (mirrors @webitel/ui-sdk isEmpty).
function isEmpty(value: unknown): boolean {
	if (Array.isArray(value)) return !value.length;
	if (value && typeof value === 'object') return !Object.keys(value).length;
	return !value;
}

function shouldInitComponent(element: FormBodyElement): boolean {
	return isEmpty(element.value) && Boolean(element.view.initialValue);
}

export function useProcessingForm(task: MaybeRefOrGetter<Task | undefined>) {
	const form = computed(
		() =>
			(toValue(task)?.attempt?.form as unknown as
				| ProcessingFormData
				| null
				| undefined) ?? null,
	);

	const hasForm = computed(() => Boolean(toValue(task)?.attempt?.hasForm));
	const formTitle = computed(() => form.value?.title ?? '');
	const formBody = computed<FormBodyElement[]>(() => form.value?.body ?? []);
	const formActions = computed<ProcessingFormAction[]>(
		() => form.value?.actions ?? [],
	);

	// Mutates each body element's value in place — form state lives on the SDK
	// Task, which is long-lived, so it survives tab/chat switches for free.
	function initializeValues() {
		const current = form.value;
		if (!current) return;

		current.body.forEach((element) => {
			if (!shouldInitComponent(element)) return;

			if (element.view.component === ProcessingFieldComponent.Select) {
				element.value = getSelectInitialValue(
					element.view.initialValue,
					element.view.options,
				);
				return;
			}

			if (element.view.component === ProcessingFieldComponent.Datetimepicker) {
				element.value = getDatetimepickerInitialValue(
					element.view.initialValue,
					element.view.currentTime,
				);
				return;
			}

			element.value = parseInitialValueToJson(element.view.initialValue);
		});

		current.metadata.isInited = true;
	}

	watch(
		formBody,
		(body) => {
			const current = form.value;
			if (body.length && current && !current.metadata?.isInited) {
				current.metadata = {}; // reset form metadata before init
				initializeValues();
			}
		},
		{
			immediate: true,
		},
	);

	function change(element: FormBodyElement, value: unknown) {
		element.value = value;
	}

	function submit(action: ProcessingFormAction) {
		const attempt = toValue(task)?.attempt;
		if (!attempt) return undefined;

		const fields =
			attempt.form?.fields ?? formattingFormBeforeSend(formBody.value);

		return attempt.formAction(action.id, fields as never);
	}

	return {
		hasForm,
		formTitle,
		formBody,
		formActions,
		change,
		submit,
	};
}
