<template>
	<wt-single-select
		v-if="!multiple"
		v-bind="$attrs"
		:model-value="modelValue"
		:options="options"
		:data-key="trackBy"
		@reset="resetValue"
		@update:model-value="emit('update:modelValue', $event)"
	/>

	<wt-multi-select
		v-else
		v-bind="$attrs"
		:model-value="modelValue"
		:options="options"
		:data-key="trackBy"
		@reset="resetValue"
		@update:model-value="emit('update:modelValue', $event)"
	/>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

import type { FormSelectOption } from '../../types/ProcessingForm.types';

// Underlying wt-single-select model is a primitive; processing forms also carry
// the resolved option object (and arrays of either for the multi variant).
// Type-only import so tests/bundle don't pull the heavy component at runtime.
type WtSingleSelectProps = InstanceType<
	typeof import('@webitel/ui-sdk/components').WtSingleSelect
>['$props'];
type SelectPrimitive = WtSingleSelectProps['modelValue'];
type SelectModelValue =
	| SelectPrimitive
	| FormSelectOption
	| Array<SelectPrimitive | FormSelectOption>;
type SelectOptions = WtSingleSelectProps['options'];

const props = withDefaults(
	defineProps<{
		modelValue?: SelectModelValue;
		options?: SelectOptions;
		multiple?: boolean;
	}>(),
	{
		options: () => [],
	},
);

const emit = defineEmits<{
	'update:modelValue': [
		value: SelectModelValue,
	];
}>();

const optionList = computed<FormSelectOption[]>(
	() => (props.options ?? []) as FormSelectOption[],
);

const trackBy = computed(() =>
	typeof optionList.value[0] === 'object' ? 'value' : null,
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
	() => props.modelValue,
	(newValue) => {
		if (isPrimitiveArray(newValue)) {
			const mappedValues = mapToOptions(newValue, optionList.value);
			// re-emit only when at least one primitive was mapped to an option
			const changed = mappedValues.some((item, i) => item !== newValue[i]);
			if (changed) emit('update:modelValue', mappedValues);
			return;
		}

		if (newValue && typeof newValue !== 'object') {
			const matchedOption = findMatchingOption(newValue, optionList.value);
			if (matchedOption) emit('update:modelValue', matchedOption);
		}
	},
	{
		immediate: true,
	},
);

const resetValue = () => {
	emit('update:modelValue', '');
};
</script>
