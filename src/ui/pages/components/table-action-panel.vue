<template>
	<div class="table-action-panel">
		<wt-search-bar
			v-if="isSearch"
			:value="searchValue"
			@input="emit('update:searchValue', $event)"
			@search="emit('search', $event)"
		/>

		<slot></slot>
		<wt-action-bar
			v-if="actions.length"
			mode="table"
			:include="includedActions"
			@click:refresh="emit('refresh')"
		>
			<template #columns>
				<wt-table-column-select
					:headers="headers"
					:static-headers="staticHeaders"
					@change="changeHeaders"
				/>
			</template>

			<template #variables>
				<wt-table-variable-column-select
					v-if="variablesStorageKey"
					:storage-key="variablesStorageKey"
					:title="$t('ui.pages.tableActionPanel.variableColumnSelect.title')"
					@update:variable-headers="updateVariableHeaders"
				/>
			</template>
		</wt-action-bar>

		<sidebar-toggle-btn />
	</div>
</template>

<script lang="ts" setup>
import type { DatalistTableHeader } from '@webitel/ui-datalist';
import { IconAction } from '@webitel/ui-sdk/enums';
import {
	useTableVariableHeaders,
	WtTableVariableColumnSelect,
} from '@webitel/ui-sdk/modules/TableVariableColumnSelect';
import { computed, toRef } from 'vue';
import { TableActionPanelAction } from '../enums/TableActionPanelAction.enum';
import SidebarToggleBtn from './sidebar-toggle-btn.vue';

const props = withDefaults(
	defineProps<{
		isSearch?: boolean;
		searchValue?: string;
		headers?: DatalistTableHeader[];
		staticHeaders?: string[];
		variablesStorageKey?: string;
		actions?: TableActionPanelAction[];
	}>(),
	{
		isSearch: false,
		headers: () => [],
		staticHeaders: () => [],
		actions: () => [],
	},
);

const emit = defineEmits<{
	'update:searchValue': [
		value: string,
	];
	search: [
		value: string,
	];
	refresh: [];
	filter: [];
	'update:headers': [
		headers: DatalistTableHeader[],
	];
}>();

const iconActionByPanelAction: Record<TableActionPanelAction, IconAction> = {
	[TableActionPanelAction.Refresh]: IconAction.REFRESH,
	[TableActionPanelAction.ColumnSelect]: IconAction.COLUMNS,
	[TableActionPanelAction.VariableColumnSelect]: IconAction.VARIABLES,
	[TableActionPanelAction.Filter]: IconAction.FILTERS,
};

const includedActions = computed(() =>
	props.actions.map((action) => iconActionByPanelAction[action]),
);

const changeHeaders = (
	value: {
		value: string;
		show: boolean;
	}[],
) => {
	emit('update:headers', value as DatalistTableHeader[]);
};

const { updateVariableHeaders } = useTableVariableHeaders({
	headers: toRef(props, 'headers'),
	updateShownHeaders: changeHeaders,
});
</script>

<style scoped>
.table-action-panel {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
}
</style>
