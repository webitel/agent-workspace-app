<template>
	<page-wrapper :tabs="tabs">
		<template #actions-panel>
			<history-page-action-panel
				v-if="currentTab?.store"
				:key="currentTab.value"
				:store="currentTab.store"
			/>
		</template>
		<template #main>
			<component :is="currentTab?.component" />
		</template>
	</page-wrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import PageWrapper from '../../components/page-wrapper.vue';
import type { PageTab } from '../../types/PageTab.types';
import { HistoryPageTab } from './enums/HistoryPageTab.enum';
import HistoryPageActionPanel from './history-page-action-panel.vue';
import CallsHistoryTable from './modules/calls/calls-history-table.vue';
import { useCallsHistoryDataListStore } from './modules/calls/store/calls-history';

type HistoryPageStore = ReturnType<typeof useCallsHistoryDataListStore>;

const { t } = useI18n();
const route = useRoute();

const tabs = computed<PageTab<HistoryPageStore>[]>(() => [
	{
		text: t('ui.pages.history.tabs.calls'),
		value: HistoryPageTab.Calls,
		pathName: HistoryPageTab.Calls,
		component: CallsHistoryTable,
		store: useCallsHistoryDataListStore(),
	},
]);

const currentTab = computed(() =>
	tabs.value.find((tab) => tab.pathName === route.name),
);
</script>
