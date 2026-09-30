<template>
	<wt-table
		:data="rows"
		:headers="headers"
		:selectable="false"
		:grid-actions="false"
		data-key="key"
	/>
</template>

<script setup lang="ts">
import type { EngineHistoryCallVariables } from '@webitel/api-services/gen/models';
import { WtTable } from '@webitel/ui-sdk/components';
import { WtTableHeader } from '@webitel/ui-sdk/components/wt-table/types/WtTable';
import { computed } from 'vue';

const props = defineProps<{
	variables?: EngineHistoryCallVariables;
}>();

const headers: WtTableHeader[] = [
	{
		value: 'key',
		locale: [
			'vocabulary.keys',
			1,
		],
	},
	{
		value: 'value',
		locale: [
			'vocabulary.values',
			1,
		],
	},
];

const rows = computed(() =>
	Object.entries(props.variables ?? {}).map(([key, value]) => ({
		key,
		value,
	})),
);
</script>
