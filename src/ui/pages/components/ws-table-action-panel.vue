<template>
	<div class="ws-table-action-panel">
		<wt-search-bar
			v-if="search"
			:value="searchValue"
			@input="emit('update:search-value', $event)"
			@search="emit('search', $event)"
		/>

		<slot />

<!--		<wt-table-column-select-->
<!--			v-if="actions.includes('columnSelect')"-->
<!--			:headers="headers"-->
<!--			@change="emit('update:headers', $event)"-->
<!--		/>-->

<!--		<wt-table-actions-->
<!--			v-if="tableActionsIcons.length"-->
<!--			:icons="tableActionsIcons"-->
<!--			@input="onTableActionsInput"-->
<!--		/>-->

		<wt-icon-btn :icon="sidebarIcon" @click="toggleSidebar" />
	</div>
</template>

<script lang="ts" setup>
import type { DatalistTableHeader } from '@webitel/ui-datalist';
import {
	WtIconBtn,
	WtSearchBar,
	// WtTableActions,
	// WtTableColumnSelect,
} from '@webitel/ui-sdk/components';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useWorkspaceSidebarStore } from '../../sidebar/store/workspace-sidebar';

export type WsTableActionPanelAction = 'refresh' | 'columnSelect' | 'filter';

const props = withDefaults(
	defineProps<{
		search?: boolean;
		searchValue?: string;
		headers?: DatalistTableHeader[];
		actions?: WsTableActionPanelAction[];
	}>(),
	{
		search: false,
		searchValue: '',
		headers: () => [],
		actions: () => [],
	},
);

const emit = defineEmits<{
	'update:search-value': [
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

// icon-emit pairs fo actions
// WtTableColumnSelect is self-contained, so don`t need that
// const actionIconMap = {
// 	refresh: 'refresh',
// 	filter: 'settings',
// };

// const tableActionsIcons = computed(() =>
//   props.actions
// );

// function onTableActionsInput(value) {}

const sidebarStore = useWorkspaceSidebarStore();
const { isOpen } = storeToRefs(sidebarStore);
const { toggle: toggleSidebar } = sidebarStore;

const sidebarIcon = computed(() =>
	isOpen.value ? 'ws-sidebar-open' : 'ws-sidebar-close',
);
</script>

<style scoped>
.ws-table-action-panel {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
}
</style>
