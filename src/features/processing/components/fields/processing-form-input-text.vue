<template>
	<wt-input-text
		v-bind="$attrs"
		:value="value"
		prevent-trim
		@update:model-value="emit('input', $event)"
	/>
</template>

<script setup lang="ts">
defineProps<{
	modelValue?: string;
	value?: string;
}>();

const emit = defineEmits<{
	input: [
		value: string,
	];
}>();
</script>
