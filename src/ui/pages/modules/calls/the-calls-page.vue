<template>
	<page-wrapper :tabs="tabs">
		<template #actions-panel>
			<calls-page-action-panel
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
import CallsPageActionPanel from './calls-page-action-panel.vue';
import { CallsPageTab } from './enums/CallsPageTab.enum';
import MissedCallsTable from './modules/missed/missed-calls-table.vue';
import { useMissedCallsDataListStore } from './modules/missed/store/missed-calls';
import OfflineCallsTable from './modules/offline/offline-calls-table.vue';
import { useOfflineCallsDataListStore } from './modules/offline/store/offline-calls';

type CallsPageStore =
	| ReturnType<typeof useMissedCallsDataListStore>
	| ReturnType<typeof useOfflineCallsDataListStore>;

const { t } = useI18n();
const route = useRoute();

const tabs = computed<PageTab<CallsPageStore>[]>(() => [
	{
		text: t('ui.pages.calls.pageTabs.missed'),
		value: CallsPageTab.Missed,
		pathName: CallsPageTab.Missed,
		component: MissedCallsTable,
		store: useMissedCallsDataListStore(),
	},
	{
		text: t('ui.pages.calls.pageTabs.offline'),
		value: CallsPageTab.Offline,
		pathName: CallsPageTab.Offline,
		component: OfflineCallsTable,
		store: useOfflineCallsDataListStore(),
	},
]);

const currentTab = computed(() =>
	tabs.value.find((tab) => tab.pathName === route.name),
);
</script>
