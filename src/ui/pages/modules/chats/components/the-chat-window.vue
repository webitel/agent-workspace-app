<template>
	<section class="the-chat-window">
		<wt-loader
			v-if="isLoaderShown"
			class="the-chat-window__loader"
		/>

		<wt-empty
			v-else-if="emptyText"
			class="the-chat-window__empty"
			:image="emptyImage"
			:text="emptyText"
			:primary-action-text="t('ui.pages.chats.closed.retry')"
			@click:primary="retryClosedChat"
		/>

		<template v-else>
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

			<wt-divider />

			<!-- under the tab strip, over the panel: the deadline has to stay in view
			     on every tab (DES-711), the form tab included -->
			<chat-top-bar
				v-if="task"
				class="the-chat-window__top-bar"
				:task="task"
			/>
			<closed-chat-top-bar
				v-else-if="closedChat?.thread"
				class="the-chat-window__top-bar"
				:thread="closedChat.thread"
			/>

			<!-- keyed by mode: a chat turning closed or active in place starts on
			     fresh panels, which read the stores of what it is now -->
			<keep-alive :key="mode">
				<component
					:is="currentTab.is"
					v-bind="currentTab.props"
					class="the-chat-window__panel"
				/>
			</keep-alive>
		</template>
	</section>
</template>

<script
	setup
	lang="ts"
>
import {
	WtDivider,
	WtEmpty,
	WtLoader,
	WtTabs,
} from '@webitel/ui-sdk/components';
import emptyTableDark from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-table-dark.svg';
import emptyTableLight from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-table-light.svg';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useThemedImage } from '../../../../../app/composables/useThemedImage';
import ChatInfo from '../../../../../features/chats/components/chat-info/chat-info.vue';
import ChatTopBar from '../../../../../features/chats/components/chat-top-bar/chat-top-bar.vue';
import { useChatWindowMode } from '../../../../../features/chats/composables/useChatWindowMode';
import ClosedChatTopBar from '../../../../../features/chats/modules/closed/components/closed-chat-top-bar.vue';
import TheClosedChatThread from '../../../../../features/chats/modules/closed/components/the-closed-chat-thread.vue';
import { useClosedChatStore } from '../../../../../features/chats/modules/closed/store/closed-chat';
import { toChatThreadMode } from '../../../../../features/chats/scripts/toChatThreadMode';
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
const mode = useChatWindowMode(threadId);

// Read on use, not held: the coordinator drops a closed chat's store when the
// agent rejoins its thread, and the next leave reads into a new one.
const closedChat = computed(() =>
	mode.value === 'closed' ? useClosedChatStore(threadId.value) : null,
);
const isLoaderShown = computed(
	() =>
		mode.value === 'pending' ||
		Boolean(closedChat.value?.isLoading && !closedChat.value.thread),
);
const emptyText = computed(() => {
	// neither active nor left by the agent (ADR-0010)
	if (closedChat.value?.isNotFound) return t('ui.pages.chats.closed.notFound');
	if (closedChat.value?.error && !closedChat.value.thread)
		return t('ui.pages.chats.closed.loadError');
	return '';
});

// Both empty states are final only until asked again: right after a chat turns
// closed in place, the read can run before the backend has recorded the leave.
function retryClosedChat() {
	void closedChat.value?.load();
}

const emptyImage = useThemedImage({
	light: emptyTableLight,
	dark: emptyTableDark,
});

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
// A closed chat always shows it, disabled, until the backend returns the
// submitted forms (ADR-0010).
const tabs = computed<ChatWindowTabItem[]>(() => [
	{
		value: 'chat',
		text: t('ui.pages.chats.tabs.chat'),
	},
	{
		value: 'info',
		text: t('ui.pages.chats.tabs.info'),
	},
	...(mode.value === 'closed'
		? [
				{
					value: 'processing',
					text: t('ui.pages.chats.tabs.postProcessing'),
					disabled: true,
				},
			]
		: hasForm.value
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
				// the left thread's own variables; the empty object still marks the
				// chat closed, so the tab does not go looking over REST
				closedThreadVariables: closedChat.value
					? (closedChat.value.thread?.variables?.variables ?? {})
					: undefined,
			},
		};
	}
	if (mode.value === 'closed') {
		return {
			is: TheClosedChatThread,
			props: {},
		};
	}
	return {
		is: TheChatThread,
		props: {
			mode: toChatThreadMode(task.value, isPostProcessing.value),
		},
	};
});

// A closed chat is read once it is known to be closed, including when it turns
// closed with its window open. A store already loaded is kept, as the Closed tab
// may have handed it over; one read before a rejoin is gone by now (see above).
watch(
	[
		threadId,
		mode,
	],
	([id, current]) => {
		if (current === 'closed') void useClosedChatStore(id).load();
	},
	{
		immediate: true,
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
	gap: var(--wt-ws-layout-sizes-root-gap);
	height: 100%;
	min-height: 0;
	min-width: 0;
}

/* the page toolbar of DES-730 */
.the-chat-window__tabs {
	--tab-gap: var(--wt-ws-page-toolbar-sizes-gap);
	--tab-underline-border-radius: var(--border-radius--pill);

	flex: 0 0 auto;
	padding: var(--wt-ws-page-toolbar-sizes-padding-y)
		var(--wt-ws-page-toolbar-sizes-padding-right)
		var(--wt-ws-page-toolbar-sizes-padding-y)
		var(--wt-ws-page-toolbar-sizes-padding-left);
	border-radius: var(--wt-ws-page-toolbar-sizes-border-radius);
	background: var(--wt-ws-page-toolbar-colors-background);
}

.the-chat-window__tab--disabled {
	display: block;
	opacity: 0.4;
}

.the-chat-window__loader,
.the-chat-window__empty {
	margin: auto;
}

.the-chat-window__top-bar {
	flex: 0 0 auto;
}

.the-chat-window__panel {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
}
</style>
