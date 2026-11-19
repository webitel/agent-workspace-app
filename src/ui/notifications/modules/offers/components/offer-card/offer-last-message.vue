<template>
    <div class="offer-last-message">
        <wt-avatar
            size="xs"
            :username="name"
        />
        <!-- the bubble is kept apart from the text, so the text's ellipsis
             overflow does not clip anything drawn on the bubble's edge -->
        <div class="offer-last-message__bubble">
            <p class="offer-last-message__text typo-body-1">
                {{ text }}
            </p>
        </div>
    </div>
</template>

<script
    setup
    lang="ts"
>
import { WtAvatar } from '@webitel/ui-sdk/components';

/** The customer's last message — chats only. */
defineProps<{
	text: string;
	/** The client's name, for their avatar. */
	name?: string;
}>();
</script>

<style scoped>
.offer-last-message {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
    width: 100%;
}

/* the client's unread message from the chat queue panel, per DES-727 */
.offer-last-message__bubble {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    padding: var(--wt-ws-chat-queue-pannel-sizes-last-message-text-padding-y) var(--wt-ws-chat-queue-pannel-sizes-last-message-text-padding-x);
    border-radius: var(--wt-ws-chat-queue-pannel-sizes-last-message-text-border-radius);
    background-color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-client-unread-background);
    color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-client-unread-color);
}

.offer-last-message__text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
</style>
