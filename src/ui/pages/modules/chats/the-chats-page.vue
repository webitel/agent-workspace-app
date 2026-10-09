<template>
	<chats-panel-wrapper
		:tabs="tabs"
		:current="currentTab"
		@change="changeTab"
	>
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
import ChatsPanelWrapper from './components/chats-panel-wrapper.vue';
import { ChatsPageTab } from './enums/ChatsPageTab.enum';
import ChatsActiveTable from './modules/active/active-chats-table.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const tabs = computed<PageTab[]>(() => [
	{
		text: t('ui.pages.chats.pageTabs.active'),
		value: ChatsPageTab.Active,
		pathName: ChatsPageTab.Active,
		component: ChatsActiveTable,
	},
]);

const currentTab = computed(() =>
	tabs.value.find((tab) => tab.pathName === route.name),
);

function changeTab(tab: PageTab) {
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