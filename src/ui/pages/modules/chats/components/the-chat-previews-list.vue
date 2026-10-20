<template>
    <div class="the-chat-previews-list">
        <header class="the-chat-previews-list__toolbar">
            <chat-list-tabs />
            <chat-unread-filter v-if="chatActiveStore.isUnreadFilterAvailable" />
        </header>
        <ul>
            <li
                v-for="chat in chatListStore.currentTasks"
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
import ChatListTabs from '../../../../../features/chats/modules/previews/components/chat-list-tabs/chat-list-tabs.vue';
import ChatPreview from '../../../../../features/chats/modules/previews/components/chat-preview/chat-preview.vue';
import ChatUnreadFilter from '../../../../../features/chats/modules/previews/components/chat-unread-filter/chat-unread-filter.vue';
import { useChatActiveStore } from '../../../../../features/chats/modules/previews/store/chat-active';
import { useChatListStore } from '../../../../../features/chats/modules/previews/store/chat-list';

const chatListStore = useChatListStore();
const chatActiveStore = useChatActiveStore();
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
</style>
