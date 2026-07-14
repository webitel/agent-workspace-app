<template>
	<section class="the-chat-window">
		<wt-tabs
			v-if="showTabs"
			class="the-chat-window__tabs"
			:current="{ value: activeTab }"
			:tabs="tabs"
			@change="activeTab = $event.value"
		/>

		<keep-alive>
			<component
				:is="currentTab.is"
				v-bind="currentTab.props"
				class="the-chat-window__panel"
			/>
		</keep-alive>
	</section>
</template>

<script
	setup
	lang="ts"
>
import { WtTabs } from '@webitel/ui-sdk/components';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useChatsStore } from '../../../../../features/chats/store/chats';
import TheProcessingForm from '../../../../../features/processing/components/the-processing-form.vue';
import TheChatConversation from './the-chat-conversation.vue';

const route = useRoute();
const chatsStore = useChatsStore();
const threadId = computed(() => route.params.threadId as string);

// The SDK task backing the open chat carries the processing form.
const task = computed(() => chatsStore.getTaskByThreadId(threadId.value));
const hasForm = computed(() => Boolean(task.value?.attempt?.hasForm));

const activeTab = ref<'chat' | 'processing'>('chat');
const showTabs = computed(() => hasForm.value);
const tabs = computed(() => {
	const result = [
		{
			value: 'chat',
			text: 'Chat',
		},
	];
	if (hasForm.value)
		result.push({
			value: 'processing',
			text: 'Task processing',
		});
	return result;
});

// Dispatch the active tab to its component; keep-alive preserves each panel's
// state (chat scroll, form input) across switches.
const currentTab = computed(() =>
	activeTab.value === 'processing' && task.value
		? {
				is: TheProcessingForm,
				props: {
					task: task.value,
				},
			}
		: {
				is: TheChatConversation,
				props: {},
			},
);

// If the processing tab disappears (form gone / task closed) while it is active,
// or when switching to a chat without a form, fall back to the chat tab.
watch(hasForm, (value) => {
	if (!value && activeTab.value === 'processing') activeTab.value = 'chat';
});
watch(threadId, () => {
	activeTab.value = 'chat';
});
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
</style>
