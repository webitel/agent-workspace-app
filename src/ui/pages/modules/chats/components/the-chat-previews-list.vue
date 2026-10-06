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
                v-for="chat in chatListStore.tasks"
                :key="chat.id"
            >
                <chat-preview :task="(chat as Task)" />
                <wt-divider />
            </li>
        </ul>
    </div>
</template>

<script
    setup
    lang="ts"
>
import { WtDivider } from '@webitel/ui-sdk/components';
import { type Task } from 'webitel-sdk';

import ChatPreview from '../../../../../features/chats/modules/previews/components/chat-preview/chat-preview.vue';
import ChatUnreadFilter from '../../../../../features/chats/modules/previews/components/chat-unread-filter/chat-unread-filter.vue';
import { useChatListStore } from '../../../../../features/chats/modules/previews/store/chat-list';

const chatListStore = useChatListStore();
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
</style>
