<template>
	<wt-input-text
		v-bind="$attrs"
		:model-value="modelValue"
		prevent-trim
		@update:model-value="emit('update:modelValue', $event)"
	/>
</template>

<script setup lang="ts">
// Mirror the underlying wt-input-text model type (type-only import — no runtime load).
type ModelValue = InstanceType<
	typeof import('@webitel/ui-sdk/components').WtInputText
>['$props']['modelValue'];

defineProps<{
	modelValue?: ModelValue;
}>();

const emit = defineEmits<{
	'update:modelValue': [
		value: ModelValue,
	];
}>();
</script>
