<template>
	<section class="the-chat-window">
		<wt-tabs
			v-if="showTabs"
			class="the-chat-window__tabs"
			:current="{ value: activeTab }"
			:tabs="tabs"
			@change="activeTab = $event.value"
		/>

		<div
			v-show="activeTab === 'chat'"
			class="the-chat-window__panel"
		>
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
		</div>

		<div
			v-if="task && hasForm"
			v-show="activeTab === 'processing'"
			class="the-chat-window__panel"
		>
			<the-processing-form :task="task" />
		</div>
	</section>
</template>

<script
	setup
	lang="ts"
>
import { mapMessagesToChatMessages } from '@webitel/ui-chats/adapters';
import { ChatAction, ChatContainer } from '@webitel/ui-chats/ui';
import { WtTabs } from '@webitel/ui-sdk/components';
import type { ResultCallbacks } from '@webitel/ui-sdk/src/types';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useChatSessionStore } from '../../../../../features/chats/store/chat-session';
import { useChatsStore } from '../../../../../features/chats/store/chats';
import { TheProcessingForm } from '../../../../../features/processing';

const { t } = useI18n();
const route = useRoute();
const chatsStore = useChatsStore();
const threadId = computed(() => route.params.threadId as string);

// Resolve reactively so the window rebinds when threadId changes; a destructured
// storeToRefs would stay pinned to the first chat's store.
const chatSession = computed(() => useChatSessionStore(threadId.value));
const thread = computed(() => chatSession.value.thread);
const messages = computed(() => chatSession.value.messages);
const hasMore = computed(() => chatSession.value.hasMore);
const isLoading = computed(() => chatSession.value.isLoading);

const chatMessages = computed(() => mapMessagesToChatMessages(messages.value));

const chatActions = [
	ChatAction.SendMessage,
	ChatAction.AttachFiles,
];

// The SDK task backing the open chat carries the processing form.
const task = computed(() => chatsStore.getTaskByThreadId(threadId.value));
const hasForm = computed(() => Boolean(task.value?.attempt?.hasForm));

const activeTab = ref<'chat' | 'processing'>('chat');
const showTabs = computed(() => hasForm.value);
const tabs = computed(() => {
	const result = [
		{
			value: 'chat',
			text: t('processing.chatTab'),
		},
	];
	if (hasForm.value)
		result.push({
			value: 'processing',
			text: t('processing.title'),
		});
	return result;
});

// If the processing tab disappears (form gone / task closed) while it is active,
// or when switching to a chat without a form, fall back to the chat tab.
watch(hasForm, (value) => {
	if (!value && activeTab.value === 'processing') activeTab.value = 'chat';
});
watch(threadId, () => {
	activeTab.value = 'chat';
});

async function handleSendMessage(
	text: string,
	{ onSuccess, onError, onComplete }: ResultCallbacks = {},
) {
	try {
		await chatSession.value.sendText(text);
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
		await chatSession.value.sendFiles(files);
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

.the-chat-window__tabs {
	flex: 0 0 auto;
	padding-bottom: var(--spacing-xs);
}

.the-chat-window__panel {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
}

.the-chat-container {
	flex: 1;
	min-height: 0;
}
</style>
