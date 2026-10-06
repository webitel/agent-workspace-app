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
        >
            <template #aside>
                <time
                    v-if="time"
                    class="chat-preview__time typo-caption"
                >
                    {{ time }}
                </time>
            </template>
        </client-identity-block>
        <chat-preview-body
            v-if="preview.lastMessage?.body"
            :text="preview.lastMessage.body"
            :sender="preview.lastMessage.sender"
            :name="preview.name"
        />
        <chat-preview-footer
            v-if="preview.queueName"
            :queue-name="preview.queueName"
        />
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { type Task } from 'webitel-sdk';

import ClientIdentityBlock from '../../../../../../ui/components/client-identity-block/client-identity-block.vue';
import { useChatAccountStore } from '../../../../store/chat-account';
import { useChatsStore } from '../../../../store/chats';
import { formatPreviewTime } from '../../scripts/formatPreviewTime';
import { toChatPreview } from '../../scripts/toChatPreview';
import { useChatPreviewsStore } from '../../store/chat-previews';
import ChatPreviewBody from './preview-body/chat-preview-body.vue';
import ChatPreviewFooter from './preview-footer/chat-preview-footer.vue';

const props = defineProps<{
	task: Task;
}>();

const chatsStore = useChatsStore();
const previewsStore = useChatPreviewsStore();
const accountStore = useChatAccountStore();
const { locale } = useI18n();

// the route param threadId equals task.thread.id
const threadId = computed(() => props.task.thread?.id ?? '');

const preview = computed(() =>
	toChatPreview(
		props.task,
		previewsStore.lastMessages[threadId.value],
		accountStore.account,
	),
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
