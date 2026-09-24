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
					v-bind="element.view"
					@update:model-value="processing.change(element, $event)"
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
import ProcessingFormDatetimepicker from './fields/processing-form-datetimepicker.vue';
import ProcessingFormInputText from './fields/processing-form-input-text.vue';
import ProcessingFormSelect from './fields/processing-form-select.vue';
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
};

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
