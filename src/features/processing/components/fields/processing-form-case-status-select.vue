<template>
	<wt-single-select
		v-bind="$attrs"
		:model-value="selectedId"
		:options="options"
		:show-clear="false"
		option-value="id"
		placeholder="Status"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<template #value>
			<wt-indicator
				:color="indicatorColor(selectedOption)"
				:text="selectedOption?.name"
			/>
		</template>

		<template #option="{ option }">
			<wt-indicator
				:color="indicatorColor(option)"
				:text="option.name"
			/>
		</template>
	</wt-single-select>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { CaseStatusOption } from '../../types/ProcessingForm.types';

// Seeded with the matching option object (WTEL-9188); a pick emits its id.
const props = withDefaults(
	defineProps<{
		modelValue?: CaseStatusOption['id'] | CaseStatusOption | null;
		options?: CaseStatusOption[];
	}>(),
	{
		modelValue: null,
		options: () => [],
	},
);

const emit = defineEmits<{
	'update:modelValue': [
		value: CaseStatusOption['id'],
	];
}>();

const selectedId = computed(() =>
	props.modelValue && typeof props.modelValue === 'object'
		? props.modelValue.id
		: props.modelValue,
);

const selectedOption = computed(() =>
	props.options.find((option) => option.id === selectedId.value),
);

// A case status is final, initial, or somewhere in between.
function indicatorColor(option?: CaseStatusOption) {
	if (option?.final) return 'final-status';
	if (option?.initial) return 'initial-status';
	return 'other-status';
}
</script>
