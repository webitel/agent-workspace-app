<template>
	<div class="active-chats-table table-section__table-wrapper">
		<wt-table
			:data="dataList"
			:headers="shownHeaders"
			:selectable="false"
			data-key="id"
			fixed-actions
			sortable
			@sort="updateSort"
		>
			<template #name="{ item }">
				<div class="active-chats-table__name">
					<wt-avatar
						:username="item.name"
						size="sm"
					/>
					<span class="active-chats-table__text">{{ item.name }}</span>
				</div>
			</template>

			<template #queue="{ item }">
				{{ item.queueName }}
			</template>

			<template #startedAt="{ item }">
				{{ formatStartedAt(item.bridgedAt) }}
			</template>

			<template #message="{ item }">
				<span class="active-chats-table__text">{{ item.lastMessage }}</span>
			</template>

			<template #duration="{ item }">
				{{ formatChatDuration(item.bridgedAt, loadedAt) }}
			</template>

			<template #actions="{ item, index }">
				<wt-icon-btn
					icon="ws-chat"
					color="chat"
					size="sm"
					@click="chatsStore.openChat(item.id)"
				/>
				<!-- in the last row, so it scrolls with the table; each new last row
				     mounts its own, which loads again while the rows do not fill it.
				     Taken out of the cell's flex flow, so it adds no gap to the icons -->
				<div
					v-if="index === dataList.length - 1"
					class="active-chats-table__load-trigger"
				>
					<wt-intersection-observer
						:can-load-more="hasMore"
						@next="loadMore"
					/>
				</div>
			</template>
		</wt-table>
	</div>
</template>

<script setup lang="ts">
import {
	WtAvatar,
	WtIntersectionObserver,
	WtTable,
} from '@webitel/ui-sdk/components';
import { FormatDateMode } from '@webitel/ui-sdk/enums';
import { formatDate } from '@webitel/ui-sdk/utils';
import { storeToRefs } from 'pinia';

import { useChatsStore } from '../../../../../../features/chats/store/chats';
import { formatChatDuration } from './scripts/formatChatDuration';
import type { useActiveChatsTableStore } from './store/active-chats-table';

const props = defineProps<{
	store: ReturnType<typeof useActiveChatsTableStore>;
}>();

const chatsStore = useChatsStore();

const { updateSort, loadMore } = props.store;
const { dataList, shownHeaders, hasMore } = storeToRefs(props.store);

// Duration is shown as of the moment the table loaded and stays until it
// loads again; it does not tick (agreed with the BA)
const loadedAt = Date.now();

// the accept time, the same one Duration counts from
const formatStartedAt = (bridgedAt?: number) =>
	bridgedAt ? formatDate(bridgedAt, FormatDateMode.DATETIME) : '';
</script>

<style scoped>
.active-chats-table__name {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	min-width: 0;
}

.active-chats-table__name .wt-avatar {
	flex-shrink: 0;
}

.active-chats-table__text {
	display: block;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.wt-icon-btn {
	padding: var(--spacing-xs);
}

.active-chats-table__load-trigger {
	position: absolute;
	inset-block-end: 0;
	inset-inline-start: 0;
}
</style>