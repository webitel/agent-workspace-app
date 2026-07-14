<template>
	<wt-datepicker
		v-bind="$attrs"
		:model-value="date"
		:timezone="timezone"
		show-time
		@update:model-value="emit('input', $event)"
	/>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getUserTimezone } from '../../utils/getUserTimezone';

const props = defineProps<{
	value?: string | number;
}>();

const emit = defineEmits<{
	input: [
		value: unknown,
	];
}>();

const date = computed(() =>
	!props.value || props.value === 'now' ? Date.now() : props.value,
);
const timezone = computed(() => getUserTimezone());
</script>
