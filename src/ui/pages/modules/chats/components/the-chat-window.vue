<template>
	<section class="the-chat-window">
		<wt-tabs
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
import { useProcessingStore } from '../../../../../features/processing/store/processing';
import TheChatThread from './the-chat-thread.vue';

type ChatWindowTab = 'chat' | 'processing';

const route = useRoute();
const chatsStore = useChatsStore();
const threadId = computed(() => route.params.threadId as string);

// The SDK task backing the open chat carries the processing form.
const task = computed(() => chatsStore.getTaskByThreadId(threadId.value));
const processing = computed(() =>
	task.value ? useProcessingStore(task.value) : null,
);
const hasForm = computed(() => Boolean(processing.value?.hasForm));
const isPostProcessing = computed(() =>
	Boolean(processing.value?.isPostProcessing),
);

// Post-processing is where an unfinished form belongs; otherwise the chat.
const defaultTab = (): ChatWindowTab =>
	hasForm.value && isPostProcessing.value ? 'processing' : 'chat';

const activeTab = ref<ChatWindowTab>(defaultTab());

// The strip stays put; only the Post-processing tab comes and goes with the
// form, and a form arriving mid-chat does not pull the agent away from it.
const tabs = computed(() => [
	{
		value: 'chat',
		text: 'Chat',
	},
	...(hasForm.value
		? [
				{
					value: 'processing',
					text: 'Post-processing',
				},
			]
		: []),
]);

// keep-alive preserves each panel (chat scroll, form input) across switches.
const currentTab = computed(() =>
	activeTab.value === 'processing' && task.value
		? {
				is: TheProcessingForm,
				props: {
					task: task.value,
				},
			}
		: {
				is: TheChatThread,
				props: {
					task: task.value,
				},
			},
);

// Opening a chat lands on its form when it is already in post-processing.
watch(threadId, () => {
	activeTab.value = defaultTab();
});

// The chat ending with a form waiting — or a form landing once it has ended —
// is the cue to fill it in.
watch(
	() => hasForm.value && isPostProcessing.value,
	(value) => {
		if (value) activeTab.value = 'processing';
	},
);

// Nothing left to show on the tab once the form is gone.
watch(hasForm, (value) => {
	if (!value && activeTab.value === 'processing') activeTab.value = 'chat';
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
