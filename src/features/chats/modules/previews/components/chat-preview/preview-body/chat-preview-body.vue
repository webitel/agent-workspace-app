<template>
    <div class="chat-preview-body">
        <!-- the client's own avatar, or the standard one for the agent -->
        <wt-avatar
            v-if="sender"
            size="xs"
            :username="sender === 'client' ? name : undefined"
        />
        <last-message-text
            :text="text"
            :sender="sender === 'client' ? 'client' : 'agent'"
            :is-unread="isUnread"
        />
    </div>
</template>

<script lang="ts" setup>
import { WtAvatar } from '@webitel/ui-sdk/components';

import LastMessageText from '../../../../../components/last-message-text/last-message-text.vue';
import type { LastMessageSender } from '../../../types/ChatPreview.types';

/** The last message of a chat, in the look AC_02.03.01 gives it by sender and unread. */
defineProps<{
	text: string;
	/** Unknown while it cannot be told; the row then shows no avatar. */
	sender?: LastMessageSender;
	/** The client's name, for their avatar. */
	name?: string;
	isUnread?: boolean;
}>();
</script>

<style scoped>
.chat-preview-body {
    display: flex;
    align-items: center;
}
</style>
