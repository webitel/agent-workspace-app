<template>
	<div class="processing-form-i-frame">
		<wt-label
			v-if="label"
			:hint="hint"
		>
			{{ label }}
		</wt-label>
		<iframe
			:src="safeSrc"
			:style="{ height }"
			:title="label || 'Embedded page'"
			allowfullscreen
			class="processing-form-i-frame__frame"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Display-only: embeds the page at `initialValue` inside the form.
const props = withDefaults(
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

// The URL comes from the form schema. Only http(s) is embedded: a `javascript:`
// or `data:` src would run script in the workspace's own origin.
const safeSrc = computed(() => {
	try {
		const url = new URL(props.initialValue);
		return url.protocol === 'https:' || url.protocol === 'http:'
			? url.href
			: 'about:blank';
	} catch {
		return 'about:blank';
	}
});

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
