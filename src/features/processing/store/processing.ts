import { eventBus } from '@webitel/ui-sdk/scripts';
import { defineStore, getActivePinia } from 'pinia';
import { computed, ref } from 'vue';
import { JobState, type Task } from 'webitel-sdk';

import type {
	FormBodyElement,
	FormTableActionPayload,
	ProcessingFormAction,
	ProcessingFormData,
	ProcessingProlongation,
} from '../types/ProcessingForm.types';
import { formattingFormBeforeSend } from '../utils/formattingFormBeforeSend';
import { initFormValues } from '../utils/initFormValues';

type AttemptId = Task['id'];

const storeId = (attemptId: AttemptId) => `processing:${attemptId}`;

// Same caching as chat-session: repeated useProcessingStore(task) calls reuse
// one defineStore wrapper instead of minting a fresh one each time.
const storeDefinitions = new Map<
	string,
	ReturnType<typeof createStoreDefinition>
>();

function notifyError(err: unknown) {
	eventBus.$emit('notification', {
		type: 'error',
		text: err instanceof Error ? err.message : String(err),
	});
}

// See ADR-0004: field values live on the SDK form; this store only holds what
// the SDK does not model, for exactly one task attempt.
function createStoreDefinition(task: Task) {
	return defineStore(storeId(task.id), () => {
		// the action in flight; every action is locked while one is
		const submittingActionId = ref<string | null>(null);
		const isSubmitting = computed(() => submittingActionId.value !== null);
		const error = ref<unknown>(null);

		// The SDK's `Form` type is looser than what the backend sends.
		const form = computed(
			() => (task.form as unknown as ProcessingFormData | null) ?? null,
		);
		const hasForm = computed(() => task.hasForm && Boolean(form.value));
		const formTitle = computed(() => form.value?.title ?? '');
		const formBody = computed<FormBodyElement[]>(() => form.value?.body ?? []);
		const formActions = computed<ProcessingFormAction[]>(
			() => form.value?.actions ?? [],
		);

		const isPostProcessing = computed(() => task.state === JobState.Processing);
		const processingTimeoutAt = computed(() => task.processingTimeoutAt);
		const renewalSec = computed(() => task.renewalSec);
		const prolongation = computed(
			() =>
				(
					task._processing as {
						processing_prolongation?: ProcessingProlongation;
					} | null
				)?.processing_prolongation,
		);
		const remainingProlongations = computed(
			() => prolongation.value?.remaining_prolongations ?? 0,
		);

		// Keeps the SDK form carrying backend-ready values for every channel, so
		// `formAction` and a later `saveForm` both send what the agent sees.
		function syncFields() {
			if (!form.value) return;
			form.value.fields = formattingFormBeforeSend(form.value.body);
		}

		// Seeds initial values once per form. The flag lives on the form itself,
		// so the next form from `setForm()` starts un-initialised on its own.
		function initialize() {
			const current = form.value;
			if (!current?.body.length || current.metadata?.isInited) return;
			initFormValues(current);
			syncFields();
		}

		function change(element: FormBodyElement, value: unknown) {
			element.value = value;
			syncFields();
		}

		// On success the backend drives what happens next — the next form via
		// `setForm()`, or the task leaving the feed — so nothing is reset here.
		async function submit(action: ProcessingFormAction) {
			if (isSubmitting.value || !form.value) return;
			submittingActionId.value = action.id;
			error.value = null;
			try {
				syncFields();
				await task.formAction(action.id, form.value.fields as never);
			} catch (err) {
				error.value = err;
				notifyError(err);
			} finally {
				submittingActionId.value = null;
			}
		}

		// A form-table row button: the backend runs the component's action with
		// the row as its variable (WTEL-6707).
		async function tableAction({
			componentId,
			action,
			row,
		}: FormTableActionPayload) {
			try {
				await task.componentAction(componentId, action, {
					[action]: row,
				} as never);
			} catch (err) {
				notifyError(err);
			}
		}

		// Falls back to the base processing time when the queue sets no
		// prolongation length (the SDK treats a falsy value that way).
		async function renew() {
			try {
				await task.renew(prolongation.value?.prolongation_sec || undefined);
			} catch (err) {
				notifyError(err);
			}
		}

		return {
			submittingActionId,
			isSubmitting,
			error,
			hasForm,
			formTitle,
			formBody,
			formActions,
			isPostProcessing,
			processingTimeoutAt,
			renewalSec,
			remainingProlongations,
			initialize,
			change,
			submit,
			tableAction,
			renew,
		};
	});
}

// One store per task attempt. The owning coordinator (the chats store for
// chats) creates and disposes it; components only read it.
export function useProcessingStore(task: Task) {
	const id = storeId(task.id);
	let useStore = storeDefinitions.get(id);
	if (!useStore) {
		useStore = createStoreDefinition(task);
		storeDefinitions.set(id, useStore);
	}
	return useStore();
}

// $dispose() leaves a setup store's state in pinia.state.value — delete it too,
// and drop the cached definition so an id is never served a stale wrapper.
export function disposeProcessing(attemptId: AttemptId) {
	const id = storeId(attemptId);
	const useStore = storeDefinitions.get(id);
	if (!useStore) return;
	useStore().$dispose();
	const pinia = getActivePinia();
	if (pinia) delete pinia.state.value[id];
	storeDefinitions.delete(id);
}
