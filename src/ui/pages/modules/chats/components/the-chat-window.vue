<template>
    <section class="the-chat-window">
        <h1>{{ thread?.subject ?? 'Chat Window' }}</h1>
        <chat-container :messages="chatMessages" />
    </section>
</template>

<script
    setup
    lang="ts"
>
import { mapMessagesToChatMessages } from '@webitel/ui-chats/adapters';
import { ChatContainer } from '@webitel/ui-chats/ui';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useChatSessionStore } from '../../../../../features/chats/store/chat-session';

const route = useRoute();
const threadId = computed(() => route.params.threadId as string);

// per-chat store (created/warmed by the coordinator on open)
const chatSession = useChatSessionStore(threadId.value);
const { thread, messages } = storeToRefs(chatSession);

// SDK IMessage[] -> ui-chats ChatMessageType[] (presentation contract)
const chatMessages = computed(() => mapMessagesToChatMessages(messages.value));
</script>

<style scoped>
.the-chat-window {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
}
</style>