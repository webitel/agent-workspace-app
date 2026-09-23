<template>
	<div class="table-action-panel">
		<wt-search-bar
			v-if="isSearch"
			:value="searchValue"
			@input="emit('update:searchValue', $event)"
			@search="emit('search', $event)"
		/>

    <slot></slot>
<!-- TODO: remove commented code below when WtTableActions and WtTableColumnSelect are implemented in the future-->
<!--		<wt-action-bar-->
<!--			mode="table"-->
<!--		/>-->

		<wt-icon-btn :icon="sidebarIcon" @click="toggleSidebar" />
	</div>
</template>

<script lang="ts" setup>
import type { DatalistTableHeader } from '@webitel/ui-datalist';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useWorkspaceSidebarStore } from '../../sidebar/store/workspace-sidebar';
import type { TableActionPanelAction } from '../enums/TableActionPanelAction.enum';

const props = withDefaults(
	defineProps<{
		isSearch?: boolean;
		searchValue?: string;
		headers?: DatalistTableHeader[];
		actions?: TableActionPanelAction[];
	}>(),
	{
		isSearch: false,
		headers: () => [],
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

const sidebarStore = useWorkspaceSidebarStore();
const { isOpen } = storeToRefs(sidebarStore);
const { toggle: toggleSidebar } = sidebarStore;

const sidebarIcon = computed(() =>
	isOpen.value ? 'ws-sidebar-open' : 'ws-sidebar-close',
);
</script>

<style scoped>
.table-action-panel {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
}
</style>
