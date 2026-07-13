<template>
    <section class="the-chat-window">
        <h1>{{ thread?.subject ?? 'Chat Window' }}</h1>
        <chat-container
            :messages="chatMessages"
            :chat-actions="chatActions"
            :can-load-next-messages="hasMore"
            :is-next-messages-loading="isLoading"
            @load-next-messages="chatSession.loadMore"
            @action:sendMessage="handleSendMessage"
            @action:attachFiles="handleAttachFiles"
        />
    </section>
</template>

<script
    setup
    lang="ts"
>
import { mapMessagesToChatMessages } from '@webitel/ui-chats/adapters';
import { ChatAction, ChatContainer } from '@webitel/ui-chats/ui';
import type { ResultCallbacks } from '@webitel/ui-sdk/src/types';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useChatsStore } from '../../../../../features/chats/store/chats';
import { useChatSessionStore } from '../../../../../features/chats/store/chat-session';

const route = useRoute();
const threadId = computed(() => route.params.threadId as string);

const chatsStore = useChatsStore();
const { openChat } = chatsStore;
openChat(threadId.value);

// per-chat store (created/warmed by the coordinator on open)
const chatSession = useChatSessionStore(threadId.value);
const { thread, messages, hasMore, isLoading } = storeToRefs(chatSession);

// SDK IMessage[] -> ui-chats ChatMessageType[] (presentation contract)
const chatMessages = computed(() => mapMessagesToChatMessages(messages.value));

const chatActions = [
	ChatAction.SendMessage,
	ChatAction.AttachFiles,
];

// ChatContainer reports outcome via ResultCallbacks (e.g. onSuccess clears the
// draft); resolve them around the store's async send.
async function handleSendMessage(
	text: string,
	{ onSuccess, onError, onComplete }: ResultCallbacks = {},
) {
	try {
		await chatSession.sendText(text);
		onSuccess?.();
	} catch (error) {
		onError?.(error as Error);
	} finally {
		onComplete?.();
	}
}

async function handleAttachFiles(
	files: File[],
	{ onSuccess, onError, onComplete }: ResultCallbacks = {},
) {
	try {
		await chatSession.sendFiles(files);
		onSuccess?.();
	} catch (error) {
		onError?.(error as Error);
	} finally {
		onComplete?.();
	}
}
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
