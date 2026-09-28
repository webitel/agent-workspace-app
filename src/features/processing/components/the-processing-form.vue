<template>
	<processing-wrapper>
		<template
			v-if="processing.formTitle"
			#title
		>
			{{ processing.formTitle }}
		</template>

		<template #form>
			<template
				v-for="(element, index) in processing.formBody"
				:key="`${element.id}-${index}`"
			>
				<component
					:is="fieldComponents[element.view.component]"
					v-if="fieldComponents[element.view.component]"
					:model-value="element.value"
					:label-props="{ hint: element.view.hint }"
					v-bind="{ ...element.view, ...contextProps(element) }"
					@update:model-value="processing.change(element, $event)"
					@table-action="processing.tableAction($event)"
				/>
				<p
					v-else
					class="the-processing-form__unsupported"
				>
					Unsupported field: {{ element.view.component }}
				</p>
			</template>
		</template>

		<template #actions>
			<wt-button
				v-for="action in processing.formActions"
				:key="action.id"
				:color="action.view.color"
				:disabled="processing.isSubmitting"
				:loading="processing.submittingActionId === action.id"
				@click="processing.submit(action)"
			>
				{{ action.view.text || action.view.id }}
			</wt-button>
		</template>
	</processing-wrapper>
</template>

<script setup lang="ts">
import { type Component, computed, watch } from 'vue';
import type { Task } from 'webitel-sdk';

import { ProcessingFieldComponent } from '../enums/ProcessingFieldComponent.enum';
import { useProcessingStore } from '../store/processing';
import type { FormBodyElement } from '../types/ProcessingForm.types';
import ProcessingFormTable from './fields/form-table/processing-form-table.vue';
import ProcessingFormCaseStatusSelect from './fields/processing-form-case-status-select.vue';
import ProcessingFormDatetimepicker from './fields/processing-form-datetimepicker.vue';
import ProcessingFormFile from './fields/processing-form-file.vue';
import ProcessingFormIFrame from './fields/processing-form-i-frame.vue';
import ProcessingFormInputText from './fields/processing-form-input-text.vue';
import ProcessingFormSelect from './fields/processing-form-select.vue';
import ProcessingFormSelectFromObject from './fields/processing-form-select-from-object.vue';
import ProcessingFormText from './fields/processing-form-text.vue';
import ProcessingWrapper from './processing-wrapper.vue';

const props = defineProps<{
	task: Task;
}>();

// Raw backend component name -> local field component. Unmapped names render a
// placeholder, so heavier field types can be added later without touching this.
const fieldComponents: Record<string, Component> = {
	[ProcessingFieldComponent.Select]: ProcessingFormSelect,
	[ProcessingFieldComponent.InputText]: ProcessingFormInputText,
	[ProcessingFieldComponent.Datetimepicker]: ProcessingFormDatetimepicker,
	[ProcessingFieldComponent.Text]: ProcessingFormText,
	[ProcessingFieldComponent.CaseStatus]: ProcessingFormCaseStatusSelect,
	[ProcessingFieldComponent.SelectFromObject]: ProcessingFormSelectFromObject,
	[ProcessingFieldComponent.IFrame]: ProcessingFormIFrame,
	[ProcessingFieldComponent.File]: ProcessingFormFile,
	[ProcessingFieldComponent.Table]: ProcessingFormTable,
};

// What a field needs from outside its schema: file uploads go against the
// attempt, and the backend knows a table by its body element id.
function contextProps(element: FormBodyElement) {
	switch (element.view.component) {
		case ProcessingFieldComponent.File:
			return {
				attemptId: props.task.id,
			};
		case ProcessingFieldComponent.Table:
			return {
				componentId: element.id,
			};
		default:
			return {};
	}
}

// Resolved per task so the same instance rebinds when the window switches chats.
const processing = computed(() => useProcessingStore(props.task));

// Seed field defaults once the form body arrives, and again for each next form.
watch(
	() => processing.value.formBody,
	() => processing.value.initialize(),
	{
		immediate: true,
	},
);
</script>

<style scoped>
.the-processing-form__unsupported {
	color: var(--text-secondary-color, var(--grey-color));
	font-style: italic;
}
</style>
