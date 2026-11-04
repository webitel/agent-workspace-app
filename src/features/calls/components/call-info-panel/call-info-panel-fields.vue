<template>
	<dl class="call-info-panel-fields">
		<div
			v-for="field in shownFields"
			:key="field.label"
			class="call-info-panel-fields__field"
		>
			<dt class="call-info-panel-fields__label typo-caption-bold">
				{{ field.label }}:
			</dt>
			<dd class="call-info-panel-fields__value typo-caption">
				{{ field.value }}
			</dd>
		</div>
	</dl>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { CallInfoPanelField } from '../../types/CallInfoPanelField.types';

const props = defineProps<{
	fields: CallInfoPanelField[];
}>();

// A field the call does not have is left out rather than shown empty.
const shownFields = computed(() => props.fields.filter(({ value }) => value));
</script>

<style scoped>
.call-info-panel-fields {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	margin: 0;
}

.call-info-panel-fields__field {
	display: flex;
	gap: var(--spacing-2xs);
	min-width: 0;
}

.call-info-panel-fields__label {
	flex: none;
}

.call-info-panel-fields__value {
	margin: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
