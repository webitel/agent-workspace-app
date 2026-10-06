<template>
    <div class="the-chat-previews-list">
        <header
            v-if="chatListStore.isUnreadFilterAvailable"
            class="the-chat-previews-list__toolbar"
        >
            <chat-unread-filter />
        </header>
        <ul>
            <li
                v-for="chat in chatListStore.visibleTasks"
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

import ChatPreview from '../../../../../features/chats/modules/previews/components/chat-preview/chat-preview.vue';
import ChatUnreadFilter from '../../../../../features/chats/modules/previews/components/chat-unread-filter/chat-unread-filter.vue';
import { useChatListStore } from '../../../../../features/chats/modules/previews/store/chat-list';

const chatListStore = useChatListStore();

const sentinel = useTemplateRef<HTMLElement>('sentinel');

const { pause, resume } = useIntersectionObserver(sentinel, ([entry]) => {
	if (entry?.isIntersecting) chatListStore.loadMore();
});

// An observer only reports a change, so a sentinel that is still in view after a
// page lands (a tall panel, short rows) would never ask again. Re-observing makes
// it report its current state.
watch(
	() => chatListStore.visibleTasks.length,
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
    justify-content: flex-end;
    padding: var(--spacing-xs);
}

.the-chat-previews-list__sentinel {
    height: 1px;
}
</style>
