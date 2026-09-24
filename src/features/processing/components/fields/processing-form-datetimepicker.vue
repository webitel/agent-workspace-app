<template>
	<wt-datepicker
		v-bind="$attrs"
		:model-value="date"
		:timezone="timezone"
		show-time
		@update:model-value="emit('update:modelValue', $event)"
	/>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getUserTimezone } from '../../utils/getUserTimezone';

// Mirror the underlying wt-datepicker model type (epoch ms | null; type-only import).
type ModelValue = InstanceType<
	typeof import('@webitel/ui-sdk/components').WtDatepicker
>['$props']['modelValue'];

const props = defineProps<{
	// backend may also send the string sentinel 'now'
	modelValue?: ModelValue | string;
}>();

const emit = defineEmits<{
	'update:modelValue': [
		value: ModelValue,
	];
}>();

// Coerce to the epoch/null the datepicker expects; 'now' / empty -> now.
const date = computed<number | null>(() => {
	const value = props.modelValue;
	if (!value || value === 'now') return Date.now();
	return typeof value === 'number' ? value : new Date(value).getTime();
});
const timezone = computed(() => getUserTimezone());
</script>
