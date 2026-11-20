<template>
    <div class="offer-last-message">
        <wt-avatar
            size="xs"
            :username="name"
        />
        <!-- a new chat's message is the client's and not read yet, per DES-727 -->
        <last-message-text
            :text="text"
            sender="client"
            is-unread
        />
    </div>
</template>

<script
    setup
    lang="ts"
>
import { WtAvatar } from '@webitel/ui-sdk/components';

import LastMessageText from '../../../../../components/last-message-text/last-message-text.vue';

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
    align-items: center;
    width: 100%;
}
</style>
