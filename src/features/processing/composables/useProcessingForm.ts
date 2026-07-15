import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import type { Task } from 'webitel-sdk';

import type {
	FormBodyElement,
	ProcessingFormAction,
	ProcessingFormData,
} from '../types/ProcessingForm.types';
import { formattingFormBeforeSend } from '../utils/formattingFormBeforeSend';
import { initFormValues } from '../utils/initFormValues';

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

	// Seed field values from their initialValue once the body arrives. Guards
	// itself so the caller can watch formBody and call it freely; state is written
	// in place on the SDK Task, so it persists across tab/chat switches.
	function initialize() {
		const current = form.value;
		if (!current) return;
		if (!current.body.length || current.metadata?.isInited) return;
		initFormValues(current);
	}

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
		initialize,
		change,
		submit,
	};
}
