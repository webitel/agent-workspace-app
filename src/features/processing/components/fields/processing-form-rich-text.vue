<template>
	<wt-rich-text-editor
		:height="height"
		:label="label"
		:label-props="labelProps"
		:model-value="text"
		:output="output"
		@update:model-value="emit('update:modelValue', $event)"
	/>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// The shared ui-sdk editor, which loads TinyMCE only when a form renders one.
const props = defineProps<{
	modelValue?: unknown;
	label?: string;
	labelProps?: Record<string, unknown>;
	/** `html` (default) or `text` */
	output?: 'html' | 'text';
	height?: number | string;
}>();

const emit = defineEmits<{
	'update:modelValue': [
		value: string,
	];
}>();

// the renderer passes every schema key; only the ones above apply
defineOptions({
	inheritAttrs: false,
});

// A seeded value can arrive as a number (JSON-parsed initialValue), which the
// editor cannot take (WTEL-4477); an unseeded one arrives as ''.
const text = computed(() =>
	props.modelValue === undefined || props.modelValue === null
		? ''
		: String(props.modelValue),
);
</script>
