<template>
	<wt-input-text
		v-bind="$attrs"
		:model-value="modelValue"
		prevent-trim
		@update:model-value="emit('update:modelValue', $event)"
	/>
</template>

<script setup lang="ts">
defineProps<{
	modelValue?: string;
}>();

const emit = defineEmits<{
	'update:modelValue': [
		value: string,
	];
}>();
</script>
