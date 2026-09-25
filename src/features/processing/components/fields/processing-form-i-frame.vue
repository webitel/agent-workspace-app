<template>
	<div class="processing-form-i-frame">
		<wt-label
			v-if="label"
			:hint="hint"
		>
			{{ label }}
		</wt-label>
		<iframe
			:src="initialValue"
			:style="{ height }"
			:title="label || 'Embedded page'"
			allowfullscreen
			class="processing-form-i-frame__frame"
		/>
	</div>
</template>

<script setup lang="ts">
// Display-only: embeds the page at `initialValue` inside the form.
withDefaults(
	defineProps<{
		initialValue?: string;
		label?: string;
		hint?: string;
		height?: string;
	}>(),
	{
		initialValue: '',
		label: '',
		hint: '',
		height: '100px',
	},
);

// the renderer passes model-value / label-props to every field; none apply here
defineOptions({
	inheritAttrs: false,
});
</script>

<style scoped>
.processing-form-i-frame__frame {
	width: 100%;
}
</style>
