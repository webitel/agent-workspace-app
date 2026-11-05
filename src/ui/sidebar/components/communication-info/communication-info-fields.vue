<template>
	<dl class="communication-info-fields">
		<div
			v-for="field in shownFields"
			:key="field.key"
			class="communication-info-fields__field"
		>
			<dt class="communication-info-fields__label typo-caption-bold">
				{{ field.label }}:
			</dt>
			<dd class="communication-info-fields__value typo-caption">
				<!-- a field's value can be replaced by its own slot, e.g. #value-from -->
				<slot
					:name="`value-${field.key}`"
					:field="field"
				>
					{{ field.value }}
				</slot>
			</dd>
		</div>
	</dl>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { CommunicationInfoField } from './types/CommunicationInfoField.types';

const props = defineProps<{
	fields: CommunicationInfoField[];
}>();

defineSlots<{
	[name: `value-${string}`]: (props: {
		field: CommunicationInfoField;
	}) => unknown;
}>();

// A field the communication does not have is left out rather than shown empty.
const shownFields = computed(() => props.fields.filter(({ value }) => value));
</script>

<style scoped>
.communication-info-fields {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	margin: 0;
}

.communication-info-fields__field {
	display: flex;
	gap: var(--spacing-2xs);
	min-width: 0;
}

.communication-info-fields__label {
	flex: none;
}

.communication-info-fields__value {
	margin: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
