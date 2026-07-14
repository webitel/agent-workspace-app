<template>
	<wt-single-select
		v-if="!multiple"
		v-bind="$attrs"
		:model-value="value"
		:options="options"
		:data-key="trackBy"
		@reset="resetValue"
		@update:model-value="emit('input', $event)"
	/>

	<wt-multi-select
		v-else
		v-bind="$attrs"
		:model-value="value"
		:options="options"
		:data-key="trackBy"
		@reset="resetValue"
		@update:model-value="emit('input', $event)"
	/>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

import type { FormSelectOption } from '../../types/ProcessingForm.types';

const props = withDefaults(
	defineProps<{
		value?: unknown;
		options?: FormSelectOption[];
		multiple?: boolean;
	}>(),
	{
		options: () => [],
	},
);

const emit = defineEmits<{
	input: [
		value: unknown,
	];
}>();

const trackBy = computed(() =>
	typeof props.options[0] === 'object' ? 'value' : null,
);

const isPrimitiveArray = (
	value: unknown,
): value is (string | number | boolean)[] =>
	Array.isArray(value) && value.some((item) => typeof item !== 'object');

const mapToOptions = (
	value: (string | number | boolean)[],
	options: FormSelectOption[],
) =>
	value.map((item) => options.find((option) => option.value === item) ?? item);

const findMatchingOption = (value: unknown, options: FormSelectOption[]) =>
	options.find((option) => option.value === value);

// Normalize primitive value(s) to the matching option object(s) so the select
// renders the label, re-emitting only when the mapping actually changes.
watch(
	() => props.value,
	(newValue) => {
		if (isPrimitiveArray(newValue)) {
			const mappedValues = mapToOptions(newValue, props.options);
			// re-emit only when at least one primitive was mapped to an option
			const changed = mappedValues.some((item, i) => item !== newValue[i]);
			if (changed) emit('input', mappedValues);
			return;
		}

		if (newValue && typeof newValue !== 'object') {
			const matchedOption = findMatchingOption(newValue, props.options);
			if (matchedOption) emit('input', matchedOption);
		}
	},
	{
		immediate: true,
	},
);

const resetValue = () => {
	emit('input', '');
};
</script>
