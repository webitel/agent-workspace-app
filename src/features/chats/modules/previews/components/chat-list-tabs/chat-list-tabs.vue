<template>
	<wt-tabs
		class="chat-list-tabs"
		:tabs="tabs"
		:current="currentTab"
		@change="chatListStore.setTab($event.value)"
	>
		<template #[ChatListTab.Active]="{ tab }">
			<span class="chat-list-tabs__tab">
				{{ tab.text }}
				<wt-badge-new
					:value="chatListStore.activeCount"
					severity="secondary"
				/>
				<wt-badge-new
					v-if="chatListStore.unreadCount > 0"
					:value="chatListStore.unreadCount"
					severity="success"
				/>
			</span>
		</template>
		<template #[ChatListTab.Snoozed]="{ tab }">
			<span class="chat-list-tabs__tab">
				{{ tab.text }}
				<wt-badge-new
					:value="chatListStore.snoozedCount"
					severity="secondary"
				/>
			</span>
		</template>
	</wt-tabs>
</template>

<script
	setup
	lang="ts"
>
import { WtBadgeNew, WtTabs } from '@webitel/ui-sdk/components';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { ChatListTab } from '../../enums/ChatListTab.enum';
import { useChatListStore } from '../../store/chat-list';

const { t } = useI18n();
const chatListStore = useChatListStore();

const tabs = computed(() => [
	{
		value: ChatListTab.Active,
		text: t('ui.chatList.tabs.active'),
	},
	{
		value: ChatListTab.Snoozed,
		text: t('ui.chatList.tabs.snoozed'),
	},
]);

const currentTab = computed(() =>
	tabs.value.find((tab) => tab.value === chatListStore.currentTab),
);
</script>

<style scoped>
.chat-list-tabs {
	--tab-gap: var(--spacing-sm);
}

.chat-list-tabs__tab {
	display: inline-flex;
	align-items: center;
	gap: var(--spacing-2xs);
}
</style>
