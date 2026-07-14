<template>
	<processing-wrapper>
		<template
			v-if="formTitle"
			#title
		>
			{{ formTitle }}
		</template>

		<template #form>
			<template
				v-for="(element, index) in formBody"
				:key="`${element.id}-${index}`"
			>
				<component
					:is="fieldComponents[element.view.component]"
					v-if="fieldComponents[element.view.component]"
					:model-value="element.value"
					:label-props="{ hint: element.view.hint }"
					v-bind="element.view"
					@update:model-value="change(element, $event)"
				/>
				<p
					v-else
					class="the-processing-form__unsupported"
				>
					{{ t('processing.unsupportedField', { component: element.view.component }) }}
				</p>
			</template>
		</template>

		<template #actions>
			<wt-button
				v-for="action in formActions"
				:key="action.id"
				:color="action.view.color"
				@click="submit(action)"
			>
				{{ action.view.text || action.view.id }}
			</wt-button>
		</template>
	</processing-wrapper>
</template>

<script setup lang="ts">
import { type Component, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Task } from 'webitel-sdk';

import { useProcessingForm } from '../composables/useProcessingForm';
import { ProcessingFieldComponent } from '../enums/ProcessingFieldComponent.enum';
import ProcessingFormDatetimepicker from './fields/processing-form-datetimepicker.vue';
import ProcessingFormInputText from './fields/processing-form-input-text.vue';
import ProcessingFormSelect from './fields/processing-form-select.vue';
import ProcessingWrapper from './processing-wrapper.vue';

const props = defineProps<{
	task: Task;
}>();

const { t } = useI18n();

// Raw backend component name -> local field component. Unmapped names render a
// placeholder, so heavier field types can be added later without touching this.
const fieldComponents: Record<string, Component> = {
	[ProcessingFieldComponent.Select]: ProcessingFormSelect,
	[ProcessingFieldComponent.InputText]: ProcessingFormInputText,
	[ProcessingFieldComponent.Datetimepicker]: ProcessingFormDatetimepicker,
};

const { formTitle, formBody, formActions, change, submit } = useProcessingForm(
	computed(() => props.task),
);
</script>

<style scoped>
.the-processing-form__unsupported {
	color: var(--text-secondary-color, var(--grey-color));
	font-style: italic;
}
</style>
