<template>
    <button
        type="button"
        class="chat-preview"
        :class="{ 'chat-preview--selected': isSelected }"
        :aria-current="isSelected || undefined"
        @click="openChat(threadId)"
    >
        <client-identity-block
            size="sm"
            :name="preview.name"
            :channel="channelInfo"
        >
            <template #aside>
                <time
                    v-if="time"
                    class="chat-preview__time typo-caption"
                >
                    {{ time }}
                </time>
            </template>
            <!-- the messages the agent has not seen (AC_02.03.03), under the time -->
            <template
                v-if="unreadCount > 0"
                #channel-aside
            >
                <wt-badge-new
                    :value="unreadCount"
                    severity="success"
                />
            </template>
        </client-identity-block>
        <last-chat-message
            v-if="preview.lastMessage?.body"
            :text="preview.lastMessage.body"
            :sender="preview.lastMessage.sender"
            :name="preview.name"
            :unread="unreadCount > 0"
        />
        <chat-preview-footer
            :queue-name="preview.queueName"
        />
    </button>
</template>

<script setup lang="ts">
import { WtBadgeNew } from '@webitel/ui-sdk/components';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { type Task } from 'webitel-sdk';

import ClientIdentityBlock from '../../../../../../ui/components/client-identity-block/client-identity-block.vue';
import { useChatAccountStore } from '../../../../store/chat-account';
import { useChatsStore } from '../../../../store/chats';
import { formatPreviewTime } from '../../scripts/formatPreviewTime';
import { toChatPreview } from '../../scripts/toChatPreview';
import { useChatPreviewsStore } from '../../store/chat-previews';
import LastChatMessage from './last-chat-message/last-chat-message.vue';
import ChatPreviewFooter from './preview-footer/chat-preview-footer.vue';

const props = defineProps<{
	task: Task;
}>();

const chatsStore = useChatsStore();
const previewsStore = useChatPreviewsStore();
const accountStore = useChatAccountStore();
const { t, locale } = useI18n();

// the route param threadId equals task.thread.id
const threadId = computed(() => props.task.thread?.id ?? '');

const preview = computed(() =>
	toChatPreview(
		props.task,
		previewsStore.lastMessages[threadId.value],
		accountStore.account,
		{
			channel: previewsStore.channels[threadId.value],
			client: previewsStore.clients[threadId.value],
		},
	),
);

// the line client-identity-block draws as `Channel: <gateway>`
const channelInfo = computed(() =>
	preview.value.channel
		? {
				label: t('vocabulary.channel', 1),
				value: preview.value.channel.name,
				icon: preview.value.channel.icon,
			}
		: undefined,
);

const unreadCount = computed(
	() => previewsStore.unreadByThread[threadId.value] ?? 0,
);

const time = computed(() => {
	const at = preview.value.lastMessage?.at;
	return at === undefined
		? undefined
		: formatPreviewTime(at, {
				locale: locale.value,
			});
});

// the chat open in the central panel (AC_02.03.04)
const isSelected = computed(() => chatsStore.mainChat?.id === threadId.value);

// openChat is an action — safe to destructure (stays bound, unlike state/getters)
const { openChat } = chatsStore;
</script>

<style scoped>
.chat-preview {
    display: flex;
    flex-direction: column;
    gap: var(--wt-ws-chat-card-sizes-root-gap);
    width: 100%;
    padding: var(--wt-ws-chat-card-sizes-root-padding-y) var(--wt-ws-chat-card-sizes-root-padding-x);
    border: none;
    border-radius: var(--wt-ws-chat-card-sizes-root-border-radius);
    background: var(--wt-ws-chat-card-colors-active-background);
    font: inherit;
    color: inherit;
    text-align: inherit;
    cursor: pointer;
}

.chat-preview:hover {
    background: var(--wt-ws-chat-card-colors-active-hover-background);
}

.chat-preview--selected,
.chat-preview--selected:hover {
    background: var(--wt-ws-chat-card-colors-active-active-background);
}

.chat-preview__time {
    white-space: nowrap;
}
</style>
