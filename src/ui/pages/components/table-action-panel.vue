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

		<wt-icon-btn :icon="sidebarIcon" @click="toggleSidebar" />
	</div>
</template>

<script lang="ts" setup>
import type { DatalistTableHeader } from '@webitel/ui-datalist';
import { IconAction } from '@webitel/ui-sdk/enums';
import {
	useTableVariableHeaders,
	WtTableVariableColumnSelect,
} from '@webitel/ui-sdk/modules/TableVariableColumnSelect';
import { storeToRefs } from 'pinia';
import { computed, toRef } from 'vue';
import { useWorkspaceSidebarStore } from '../../sidebar/store/workspace-sidebar';
import { TableActionPanelAction } from '../enums/TableActionPanelAction.enum';

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

const sidebarStore = useWorkspaceSidebarStore();
const { isOpen } = storeToRefs(sidebarStore);
const { toggle: toggleSidebar } = sidebarStore;

const sidebarIcon = computed(() =>
	isOpen.value ? 'ws-sidebar-open' : 'ws-sidebar-close',
);

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
