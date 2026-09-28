<template>
    <ul class="the-chat-previews-list">
        <li
            v-for="chat in chatTaskList"
            :key="chat.id"
        >
            <chat-preview :task="(chat as Task)" />
            <wt-divider />
        </li>
    </ul>
</template>

<script
    setup
    lang="ts"
>
import { WtDivider } from '@webitel/ui-sdk/components';
import { storeToRefs } from 'pinia';
import { type Task } from 'webitel-sdk';
import ChatPreview from '../../../../../features/chats/components/chat-preview/chat-preview.vue';
import { useChatsStore } from '../../../../../features/chats/store/chats';

const chatsStore = useChatsStore();
const { chatTaskList } = storeToRefs(chatsStore);
</script>

<style scoped>
.the-chat-previews-list {
}
</style>
