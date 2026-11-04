<template>
	<!-- keyed by call: the table's sort must not follow the agent into another -->
	<variables-table
		:key="call.id"
		class="call-info"
		:rows="rows"
	/>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Call } from 'webitel-sdk';

import VariablesTable from '../../../variables/components/variables-table.vue';
import { toVariableRows } from '../../../variables/scripts/toVariableRows';

const props = defineProps<{
	call: Call;
}>();

// The call's own variables only, not merged with its task's (ADR-0009). The SDK
// types them as a Map, but assigns the event payload, a plain object.
const rows = computed(() =>
	toVariableRows(
		props.call.variables as unknown as Record<string, unknown> | undefined,
		'call',
	),
);
</script>
