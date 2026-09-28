<template>
	<div class="processing-form-table">
		<wt-expansion-panel :collapsed="table.defaultCollapsed">
			<template #title>
				<div class="processing-form-table__title">
					<div class="processing-form-table__title-icon">
						<wt-icon
							color="on-dark"
							icon="table"
						/>
					</div>
					<span>{{ table.headerTitle || 'Table' }}</span>
				</div>
			</template>

			<div class="processing-form-table__body wt-scrollbar">
				<wt-table
					:data="rows"
					:grid-actions="false"
					:headers="headers"
					:selectable="false"
					class="processing-form-table__table"
				>
					<template
						v-for="header in headers"
						#[header.value]="{ item }"
						:key="header.value"
					>
						<processing-form-table-cell
							:type="header.type"
							:value="item[header.value]"
						/>
					</template>
					<!-- an action takes over its column: the value, then its button -->
					<template
						v-for="action in rowActions"
						#[action.slot]="{ item }"
						:key="action.slot"
					>
						<div class="processing-form-table__action">
							<span>{{ item[action.slot] }}</span>
							<wt-button
								:color="action.color"
								size="sm"
								@click="emitAction(action, item)"
							>
								{{ action.buttonName }}
							</wt-button>
						</div>
					</template>
				</wt-table>
				<wt-intersection-observer
					:can-load-more="canLoadMore && !isLoadingMore"
					:loading="isLoadingMore"
					@next="loadMore"
				/>
			</div>
		</wt-expansion-panel>
	</div>
</template>

<script setup lang="ts">
import {
	applyTransform,
	camelToSnake,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { computed, onMounted, ref } from 'vue';

import { getFormTableRows } from '../../../api/formTableRows';
import type {
	FormTableAction,
	FormTableActionPayload,
	FormTableConfig,
	FormTableRow,
} from '../../../types/ProcessingForm.types';
import {
	readColumnValue,
	toPathSteps,
	toSlotKey,
} from '../../../utils/formTableValues';
import ProcessingFormTableCell from './processing-form-table-cell.vue';

const props = withDefaults(
	defineProps<{
		/** the body element id, which the backend knows the component by */
		componentId: string;
		table?: FormTableConfig;
		/** pre-built `key=value` query filters for a system source */
		filters?: string[];
		fields?: string[];
		actions?: FormTableAction[];
	}>(),
	{
		table: () => ({
			displayColumns: [],
		}),
		filters: () => [],
		fields: () => [],
		actions: () => [],
	},
);

const emit = defineEmits<{
	'table-action': [
		payload: FormTableActionPayload,
	];
}>();

// the renderer passes model-value / label-props to every field
defineOptions({
	inheritAttrs: false,
});

// Rows are camelCased by api-services' snakeToCamel — the rows API applies it,
// and so does this for an inline source — so the column paths go through the
// same transformer, or a key it leaves alone (`phone_2`) would never match.
const columns = computed(() =>
	(props.table.displayColumns ?? []).map((column) => ({
		...column,
		slot: toSlotKey(column.field),
		steps: applyTransform(toPathSteps(column.field), [
			snakeToCamel(),
		]) as string[],
	})),
);

const headers = computed(() =>
	columns.value.map((column) => ({
		value: column.slot,
		text: column.name,
		type: column.type,
		width: column.width ? `${column.width}px` : '',
	})),
);

const rowActions = computed(() =>
	props.actions.map((action) => ({
		...action,
		slot: toSlotKey(action.field),
	})),
);

// what a system source is asked for: the schema's fields plus each column's root
const requestFields = computed(
	() =>
		applyTransform(
			[
				...new Set([
					...props.fields,
					...columns.value.map((column) => column.steps[0]),
				]),
			],
			[
				camelToSnake(),
			],
		) as string[],
);

const rows = ref<FormTableRow[]>([]);
const page = ref(1);
const canLoadMore = ref(false);
const isLoadingMore = ref(false);

// Flattens each record into one value per column, keyed by the column slot.
function toRows(records: FormTableRow[]): FormTableRow[] {
	return records.map((record) => {
		const row: FormTableRow = {
			...record,
		};
		for (const column of columns.value) {
			const [first, ...rest] = column.steps;
			row[column.slot] = readColumnValue(record[first], rest);
		}
		return row;
	});
}

async function fetchPage() {
	try {
		return await getFormTableRows({
			path: props.table.systemSource?.path ?? '',
			filters: props.filters,
			fields: requestFields.value,
			page: page.value,
		});
	} catch (err) {
		eventBus.$emit('notification', {
			type: 'error',
			text: 'Could not load the table',
		});
		throw err;
	}
}

async function loadFirstPage() {
	if (!props.table.isSystemSource) {
		rows.value = toRows(
			applyTransform(props.table.source ?? [], [
				snakeToCamel(),
			]) as FormTableRow[],
		);
		return;
	}
	const { items, next } = await fetchPage();
	rows.value = toRows(items);
	canLoadMore.value = next;
}

async function loadMore() {
	isLoadingMore.value = true;
	page.value += 1;
	try {
		const { items, next } = await fetchPage();
		rows.value = [
			...rows.value,
			...toRows(items),
		];
		canLoadMore.value = next;
	} finally {
		isLoadingMore.value = false;
	}
}

function emitAction(action: FormTableAction, row: FormTableRow) {
	emit('table-action', {
		componentId: props.componentId,
		action: action.action,
		row,
	});
}

onMounted(() => {
	loadFirstPage().catch(() => {});
});
</script>

<style scoped>
.processing-form-table__body {
	max-height: 418px;
	overflow-y: auto;
}

.processing-form-table__table {
	padding: var(--spacing-xs);
}

.processing-form-table__title {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
}

.processing-form-table__title-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: var(--icon-md-size);
	height: var(--icon-md-size);
	border-radius: var(--border-radius);
	background: var(--icon-info-color, var(--info-color));
}

.processing-form-table__action {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: var(--spacing-xs);
}
</style>
