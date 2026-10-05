<template>
    <div
        class="chat-preview-body"
        :class="`chat-preview-body--${sender === 'client' ? 'client' : 'agent'}`"
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
 * The last message of a chat. Only the read look exists: whether a message is
 * unread has no source yet, so the unread colours are not wired.
 */
defineProps<{
	text: string;
	/** Unknown while it cannot be told; the row then shows no avatar. */
	sender?: LastMessageSender;
	/** The client's name, for their avatar. */
	name?: string;
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

.chat-preview-body--client {
    background: var(--wt-ws-chat-queue-pannel-colors-last-message-text-client-read-background);
    color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-client-read-color);
}

.chat-preview-body--agent {
    background: var(--wt-ws-chat-queue-pannel-colors-last-message-text-agent-read-background);
    color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-agent-read-color);
}

.chat-preview-body__text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
</style>
