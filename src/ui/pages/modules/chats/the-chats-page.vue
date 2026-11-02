<template>
	<chats-panel-wrapper
		:tabs="tabs"
		:current="currentTab"
		@change="changeTab"
	>
		<template #actions-panel>
			<chats-page-action-panel
				v-if="currentTab?.store"
				:key="currentTab.value"
				:store="currentTab.store"
			/>
		</template>
		<template #main>
			<component
				:is="currentTab?.component"
				class="the-chats-page__panel"
			/>
		</template>
	</chats-panel-wrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { PageTab } from '../../types/PageTab.types';
import ChatsPageActionPanel from './chats-page-action-panel.vue';
import ChatsPanelWrapper from './components/chats-panel-wrapper.vue';
import { ChatsPageTab } from './enums/ChatsPageTab.enum';
import ChatsActiveTable from './modules/active/active-chats-table.vue';
import { useActiveChatsDataListStore } from './modules/active/store/active-chats';
import ChatsClosedTable from './modules/closed/closed-chats-table.vue';

type ChatsPageStore = ReturnType<typeof useActiveChatsDataListStore>;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const tabs = computed<PageTab<ChatsPageStore>[]>(() => [
	{
		text: t('ui.pages.chats.pageTabs.active'),
		value: ChatsPageTab.Active,
		pathName: ChatsPageTab.Active,
		component: ChatsActiveTable,
		store: useActiveChatsDataListStore(),
	},
	// no store: the closed chats list is not searchable, so there is no action panel
	{
		text: t('ui.pages.chats.pageTabs.closed'),
		value: ChatsPageTab.Closed,
		pathName: ChatsPageTab.Closed,
		component: ChatsClosedTable,
	},
]);

const currentTab = computed(() =>
	tabs.value.find((tab) => tab.pathName === route.name),
);

function changeTab(tab: PageTab<ChatsPageStore>) {
	if (tab.pathName === route.name) return;
	router.push({
		name: tab.pathName,
	});
}
</script>

<style scoped>
.the-chats-page__panel {
	flex: 1;
	min-height: 0;
}
</style>