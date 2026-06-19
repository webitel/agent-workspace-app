<template>
    <ul class="the-chat-previews-list">
        <li
            v-for="chat in chatTaskList"
            :key="chat.id"
        >
            <chat-preview :task="(chat as TaskPreview)" />
        </li>
    </ul>
</template>

<script
    setup
    lang="ts"
>
import { storeToRefs } from 'pinia';

import { useChatsStore } from '../../../../../features/chats/store/chats';
import ChatPreview from '../../../../../features/chats/components/chat-preview/chat-preview.vue';
import type { TaskPreview } from '../../../../../features/chats/types/ChatPreview.types';

const chatsStore = useChatsStore();
const { chatTaskList } = storeToRefs(chatsStore);
</script>

<style scoped></style>