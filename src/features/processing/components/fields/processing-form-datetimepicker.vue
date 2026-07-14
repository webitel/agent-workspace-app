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

const props = defineProps<{
	modelValue?: string | number;
}>();

const emit = defineEmits<{
	'update:modelValue': [
		value: unknown,
	];
}>();

const date = computed(() =>
	!props.modelValue || props.modelValue === 'now'
		? Date.now()
		: props.modelValue,
);
const timezone = computed(() => getUserTimezone());
</script>
