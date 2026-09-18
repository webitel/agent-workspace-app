<template>
	<ws-page-wrapper :tabs="tabs">
		<template #actions-panel>
			<ws-table-action-panel
				:search="!!currentTab?.search"
				:search-value="actionPanel?.searchValue"
				:headers="actionPanel?.headers"
				:actions="currentTab?.actions ?? []"
				@update:search-value="(value) => { if (actionPanel) actionPanel.searchValue = value }"
				@search="(value) => actionPanel?.handleSearch(value)"
				@refresh="() => actionPanel?.refresh()"
				@update:headers="(headers) => actionPanel?.updateShownHeaders(headers)"
			/>
		</template>
		<template #main>
			<component :is="currentTab?.component" />
		</template>
	</ws-page-wrapper>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import WsPageWrapper from '../../components/ws-page-wrapper.vue';
import WsTableActionPanel, {
	type WsTableActionPanelAction,
} from '../../components/ws-table-action-panel.vue';
import {
	type TableActionPanelStore,
	useTableActionPanel,
} from '../../composables/useTableActionPanel';
import MissedCallsTab from './modules/missed-calls/missed-calls-tab.vue';
import { useMissedCallsStore } from './modules/missed-calls/store/missedCalls';

interface CallsPageTab {
	text: string;
	value: string;
	pathName: string;
	component: Component;
	getTableStore?: () => TableActionPanelStore;
	actions: WsTableActionPanelAction[];
	search?: boolean;
}

const { t } = useI18n();
const route = useRoute();

const tabs = computed<CallsPageTab[]>(() => [
	{
		text: t('ui.pages.calls.tabs.missed'),
		value: 'missed',
		pathName: 'calls',
		component: MissedCallsTab,
		getTableStore: useMissedCallsStore,
		actions: [],
	},
]);

const currentTab = computed(() =>
	tabs.value.find((tab) => tab.pathName === route.name),
);

const actionPanel = computed(() =>
	currentTab.value?.getTableStore
		? useTableActionPanel(currentTab.value.getTableStore())
		: null,
);
</script>
