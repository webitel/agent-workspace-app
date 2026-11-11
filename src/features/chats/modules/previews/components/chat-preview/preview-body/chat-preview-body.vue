<template>
    <div
        class="chat-preview-body"
        :class="`chat-preview-body--${sender === 'client' ? 'client' : 'agent'}-${unread ? 'unread' : 'read'}`"
    >
        <!-- the client's own avatar, or the standard one for the agent -->
        <wt-avatar
            v-if="sender"
            size="xs"
            :username="sender === 'client' ? name : undefined"
        />
        <p class="chat-preview-body__text typo-body-1">
            {{ text }}
        </p>
    </div>
</template>

<script lang="ts" setup>
import { WtAvatar } from '@webitel/ui-sdk/components';

import type { LastMessageSender } from '../../../types/ChatPreview.types';

/**
 * The last message of a chat. It reads as unread while the chat has messages
 * the agent has not seen (AC_02.03.01): the newest one is then among them.
 */
defineProps<{
	text: string;
	/** Unknown while it cannot be told; the row then shows no avatar. */
	sender?: LastMessageSender;
	/** The client's name, for their avatar. */
	name?: string;
	/** The chat has messages the agent has not seen. */
	unread?: boolean;
}>();
</script>

<style scoped>
.chat-preview-body {
    display: flex;
    gap: var(--wt-ws-chat-queue-pannel-sizes-last-message-text-gap);
    align-items: center;
    padding: var(--wt-ws-chat-queue-pannel-sizes-last-message-text-padding-y) var(--wt-ws-chat-queue-pannel-sizes-last-message-text-padding-x);
    border-radius: var(--wt-ws-chat-queue-pannel-sizes-last-message-text-border-radius);
}

.chat-preview-body--client-read {
    background: var(--wt-ws-chat-queue-pannel-colors-last-message-text-client-read-background);
    color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-client-read-color);
}

.chat-preview-body--client-unread {
    background: var(--wt-ws-chat-queue-pannel-colors-last-message-text-client-unread-background);
    color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-client-unread-color);
}

.chat-preview-body--agent-read {
    background: var(--wt-ws-chat-queue-pannel-colors-last-message-text-agent-read-background);
    color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-agent-read-color);
}

.chat-preview-body--agent-unread {
    background: var(--wt-ws-chat-queue-pannel-colors-last-message-text-agent-unread-background);
    color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-agent-unread-color);
}

.chat-preview-body__text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
</style>
