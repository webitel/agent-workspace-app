<template>
	<wt-multi-select
		v-if="multiple"
		v-bind="$attrs"
		:label="selectLabel"
		:model-value="modelValue"
		:search-method="searchObjects"
		@update:model-value="emit('update:modelValue', $event)"
	/>

	<wt-single-select
		v-else
		v-bind="$attrs"
		:label="selectLabel"
		:model-value="modelValue"
		:search-method="searchObjects"
		@update:model-value="emit('update:modelValue', $event)"
	/>
</template>

<script setup lang="ts">
import { SysTypesAPI } from '@webitel/api-services/api';
import { computed } from 'vue';

import type { FormObjectSource } from '../../types/ProcessingForm.types';

// Picks records of the object the form schema points at; the selected record
// (or records) is the value, and goes to the backend as-is.
const props = defineProps<{
	modelValue?: unknown;
	object: FormObjectSource;
	multiple?: boolean;
	label?: string;
}>();

const emit = defineEmits<{
	'update:modelValue': [
		value: unknown,
	];
}>();

const selectLabel = computed(() => props.label || props.object.source?.name);

function searchObjects(params: Record<string, unknown>) {
	return SysTypesAPI.getLookup({
		...params,
		path: props.object.source?.path ?? '',
		filters: props.object.filters ?? [],
		fields: props.object.fields ?? [],
		primary: 'id',
		display: props.object.displayColumn ?? 'name',
	});
}
</script>
