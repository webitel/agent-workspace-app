<template>
    <div class="the-chat-previews-list">
        <header class="the-chat-previews-list__toolbar">
            <chat-list-tabs />
            <chat-unread-filter v-if="chatActiveStore.isUnreadFilterAvailable" />
        </header>
        <chat-list-search class="the-chat-previews-list__search" />
        <ul>
            <li
                v-for="chat in chatListStore.currentTasks"
                :key="chat.id"
            >
                <chat-preview :task="(chat as Task)" />
                <wt-divider />
            </li>
        </ul>
        <!-- scrolling to it asks for the next page of chats (AC_02.01.02) -->
        <div
            v-if="chatListStore.hasMore"
            ref="sentinel"
            class="the-chat-previews-list__sentinel"
        />
    </div>
</template>

<script
    setup
    lang="ts"
>
import { useIntersectionObserver } from '@vueuse/core';
import { WtDivider } from '@webitel/ui-sdk/components';
import { useTemplateRef, watch } from 'vue';
import { type Task } from 'webitel-sdk';

import ChatListSearch from '../../../../../features/chats/modules/previews/components/chat-list-search/chat-list-search.vue';
import ChatListTabs from '../../../../../features/chats/modules/previews/components/chat-list-tabs/chat-list-tabs.vue';
import ChatPreview from '../../../../../features/chats/modules/previews/components/chat-preview/chat-preview.vue';
import ChatUnreadFilter from '../../../../../features/chats/modules/previews/components/chat-unread-filter/chat-unread-filter.vue';
import { useChatActiveStore } from '../../../../../features/chats/modules/previews/store/chat-active';
import { useChatListStore } from '../../../../../features/chats/modules/previews/store/chat-list';

const chatListStore = useChatListStore();
const chatActiveStore = useChatActiveStore();

const sentinel = useTemplateRef<HTMLElement>('sentinel');

const { pause, resume } = useIntersectionObserver(sentinel, ([entry]) => {
	if (entry?.isIntersecting) chatListStore.loadMore();
});

// An observer only reports a change, so a sentinel that is still in view after a
// page lands (a tall panel, short rows) would never ask again. Re-observing makes
// it report its current state.
watch(
	() => chatListStore.currentTasks.length,
	() => {
		pause();
		resume();
	},
	{
		flush: 'post',
	},
);
</script>

<style scoped>
.the-chat-previews-list {
    overflow-y: auto;
}

.the-chat-previews-list__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs);
}

.the-chat-previews-list__search {
    padding: 0 var(--spacing-xs);
}

.the-chat-previews-list__sentinel {
    height: 1px;
}
</style>
