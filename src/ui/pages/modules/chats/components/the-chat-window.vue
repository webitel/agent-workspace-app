<template>
	<section class="the-chat-window">
		<!-- above the tabs: the deadline has to stay in view on every one of them
		     (DES-711), the form tab included -->
		<chat-top-bar
			v-if="task"
			class="the-chat-window__top-bar"
			:task="task"
		/>

		<wt-tabs
			class="the-chat-window__tabs"
			:current="{ value: activeTab }"
			:tabs="tabs"
			@change="handleTabChange"
		>
			<!-- WtTabs has no disabled state; its buttons stay clickable, so the
			     handler ignores these and the span below greys the label out -->
			<template
				v-for="tab in disabledTabs"
				:key="tab.value"
				#[tab.value]
			>
				<span
					class="the-chat-window__tab--disabled"
					aria-disabled="true"
				>
					{{ tab.text }}
				</span>
			</template>
		</wt-tabs>

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
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import ChatInfo from '../../../../../features/chats/components/chat-info/chat-info.vue';
import ChatTopBar from '../../../../../features/chats/components/chat-top-bar/chat-top-bar.vue';
import { useChatsStore } from '../../../../../features/chats/store/chats';
import TheProcessingForm from '../../../../../features/processing/components/the-processing-form.vue';
import { useProcessingStore } from '../../../../../features/processing/store/processing';
import TheChatThread from './the-chat-thread.vue';

type ChatWindowTab = 'chat' | 'info' | 'processing';

interface ChatWindowTabItem {
	value: string;
	text: string;
	/** the tab shows in the strip (DES-730) but has no content yet */
	disabled?: boolean;
}

const { t } = useI18n();
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

// The strip follows Figma (DES-730): Chat, Info, Post-processing, then the tabs
// whose content is not built yet. Only Post-processing comes and goes with the
// form, and a form arriving mid-chat does not pull the agent away from the chat.
const tabs = computed<ChatWindowTabItem[]>(() => [
	{
		value: 'chat',
		text: t('ui.pages.chats.tabs.chat'),
	},
	{
		value: 'info',
		text: t('ui.pages.chats.tabs.info'),
	},
	...(hasForm.value
		? [
				{
					value: 'processing',
					text: t('ui.pages.chats.tabs.postProcessing'),
				},
			]
		: []),
	{
		value: 'interaction',
		text: t('ui.pages.chats.tabs.interaction'),
		disabled: true,
	},
	{
		value: 'contact',
		text: t('ui.pages.chats.tabs.contact'),
		disabled: true,
	},
	{
		value: 'iframe',
		text: t('ui.pages.chats.tabs.iframe'),
		disabled: true,
	},
]);

const disabledTabs = computed(() => tabs.value.filter((tab) => tab.disabled));

function handleTabChange(tab: ChatWindowTabItem) {
	if (tab.disabled) return;
	activeTab.value = tab.value as ChatWindowTab;
}

// keep-alive preserves each panel (chat scroll, form input) across switches.
const currentTab = computed(() => {
	if (activeTab.value === 'processing' && task.value) {
		return {
			is: TheProcessingForm,
			props: {
				task: task.value,
			},
		};
	}
	if (activeTab.value === 'info') {
		return {
			is: ChatInfo,
			props: {
				task: task.value,
				threadId: threadId.value,
			},
		};
	}
	return {
		is: TheChatThread,
		props: {},
	};
});

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
	height: 100%;
	min-height: 0;
	min-width: 0;
}

.the-chat-window__top-bar {
	flex: 0 0 auto;
	margin-bottom: var(--spacing-xs);
}

.the-chat-window__tabs {
	flex: 0 0 auto;
	padding-bottom: var(--spacing-xs);
}

.the-chat-window__tab--disabled {
	display: block;
	opacity: 0.4;
}

.the-chat-window__panel {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
}
</style>
