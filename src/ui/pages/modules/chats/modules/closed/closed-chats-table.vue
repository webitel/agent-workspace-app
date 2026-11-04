<template>
	<div class="chats-closed-table">
		<wt-table
			:data="dataList"
			:headers="shownHeaders"
			:lazy="true"
			:selected="selected"
			:on-loading="onLoading"
			data-key="id"
			fixed-actions
			resizable-columns
			reorderable-columns
			@column-resize="columnResize"
			@column-reorder="columnReorder"
			@update:selected="updateSelected"
		>
			<template #startedAt="{ item }">
				{{ formatOptionalDate(item.startedAt) }}
			</template>

			<template #endedAt="{ item }">
				{{ formatOptionalDate(item.endedAt) }}
			</template>

			<template #duration="{ item }">
				{{ item.duration === undefined ? '' : convertDuration(item.duration) }}
			</template>

			<template #actions="{ item }">
				<wt-icon-btn
					icon="ws-chat"
					:size="ComponentSize.SM"
					color="chat"
					@click="openChat(item)"
				/>
			</template>
		</wt-table>
	</div>
</template>

<script setup lang="ts">
import { createLeftThread } from '@webitel/chat-web-sdk';
import { WtTable } from '@webitel/ui-sdk/components';
import { ComponentSize, FormatDateMode } from '@webitel/ui-sdk/enums';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { formatDate } from '@webitel/ui-sdk/utils';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { serviceConfig } from '../../../../../../features/chats/api/chatSdk';
import { seedClosedChat } from '../../../../../../features/chats/modules/closed/store/closed-chat';
import { useChatsStore } from '../../../../../../features/chats/store/chats';
import type { ClosedChatRow } from './api/closedChatsApiModule';
import { useClosedChatsDataListStore } from './store/closed-chats';

const store = useClosedChatsDataListStore();
const chatsStore = useChatsStore();

const {
	initialize,
	appendToDataList,
	updateSelected,
	columnResize,
	columnReorder,
} = store;
const { dataList, selected, shownHeaders, next, isLoading } =
	storeToRefs(store);

const isInitializing = ref(true);

const onLoading = async () => {
	if (isInitializing.value || isLoading.value || !next.value) return;
	await appendToDataList();
};

const formatOptionalDate = (timestamp?: number) =>
	timestamp === undefined ? '' : formatDate(timestamp, FormatDateMode.DATETIME);

// openChat pushes the chat window route; a plain router.push would be sent
// back to /chats, since the workspace only keeps chats opened through it
const openChat = (row: ClosedChatRow) => {
	seedClosedChat(
		createLeftThread(row.thread, {
			serviceConfig,
		}),
	);
	chatsStore.openChat(row.id);
};

initialize().finally(() => {
	isInitializing.value = false;
});
</script>

<style scoped>
.wt-icon-btn {
	padding: var(--spacing-xs);
}
</style>
