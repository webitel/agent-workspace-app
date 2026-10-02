<template>
	<section class="variables-table">
		<wt-message
			v-if="error"
			class="variables-table__error"
			color="error"
		>
			<span>{{ t('ui.variables.loadError') }}</span>
			<wt-button
				:loading="isLoading"
				color="secondary"
				size="sm"
				variant="text"
				@click="emit('retry')"
			>
				{{ t('reusable.retry') }}
			</wt-button>
		</wt-message>

		<!-- nothing to show yet, and still waiting on the first answer -->
		<wt-loader v-if="isPending && !rows.length" />

		<wt-table
			v-else-if="rows.length"
			:data="sortedRows"
			:headers="headers"
			:selectable="false"
			:grid-actions="false"
			sortable
			data-key="id"
			@sort="handleSort"
		>
			<template #key="{ item }">
				<span class="variables-table__cell typo-body-1-bold">
					{{ item.key }}
				</span>
			</template>
			<template #value="{ item }">
				<span class="variables-table__cell">{{ item.value }}</span>
			</template>
		</wt-table>

		<!-- a failed read has its own message above; no "empty" on top of it -->
		<wt-empty
			v-else-if="!error"
			:image="emptyImage"
			:text="t('ui.variables.empty')"
			size="sm"
		/>
	</section>
</template>

<script setup lang="ts">
import {
	WtButton,
	WtEmpty,
	WtLoader,
	WtMessage,
	WtTable,
} from '@webitel/ui-sdk/components';
import type { WtTableHeader } from '@webitel/ui-sdk/components/wt-table/types/WtTable';
import { SortSymbols } from '@webitel/ui-sdk/scripts';
import emptyTableDark from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-table-dark.svg';
import emptyTableLight from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-table-light.svg';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAppearanceStore } from '../../appearance/store/appearanceStore';
import { sortVariableRows } from '../scripts/sortVariableRows';
import type { VariableRow, VariableSort } from '../types/Variables.types';

/**
 * A sortable Key/Value table of an interaction's variables, whichever one it
 * is. It only displays: where the rows come from, how they are fetched and when
 * they are refreshed belong to the caller. Its sort is its own state, so a
 * caller showing another interaction in the same place gives it a new `key`.
 */
const props = defineProps<{
	rows: VariableRow[];
	/** the rows are fetched, and no answer has come yet */
	isPending?: boolean;
	/** a (re)fetch is running; busies the retry button */
	isLoading?: boolean;
	/** the last fetch failed; the rows from before it stay on screen */
	error?: unknown;
}>();

const emit = defineEmits<{
	retry: [];
}>();

const { t } = useI18n();
const appearanceStore = useAppearanceStore();

const emptyImage = computed(() =>
	appearanceStore.darkMode ? emptyTableDark : emptyTableLight,
);

const sort = ref<VariableSort | null>(null);
const sortedRows = computed(() => sortVariableRows(props.rows, sort.value));

const sortOf = (field: VariableSort['field']) =>
	sort.value?.field === field ? sort.value.order : SortSymbols.NONE;

const headers = computed<WtTableHeader[]>(() => [
	{
		value: 'key',
		field: 'key',
		locale: [
			'vocabulary.keys',
			1,
		],
		sort: sortOf('key'),
	},
	{
		value: 'value',
		field: 'value',
		locale: [
			'vocabulary.values',
			1,
		],
		sort: sortOf('value'),
	},
]);

function handleSort(
	header: WtTableHeader,
	order: VariableSort['order'] | typeof SortSymbols.NONE,
) {
	sort.value =
		order === SortSymbols.NONE
			? null
			: {
					field: header.field as VariableSort['field'],
					order,
				};
}
</script>

<style scoped>
.variables-table {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
}

.variables-table__error {
	margin-bottom: var(--spacing-xs);
}

.variables-table__cell {
	overflow-wrap: anywhere;
}
</style>
