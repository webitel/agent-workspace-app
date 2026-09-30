<template>
    <section class="the-chats-workspace">
        <wt-layout :default-width="320" resizable>
            <the-chat-previews-list />
        </wt-layout>
        <wt-layout>
            <router-view />
        </wt-layout>
    </section>
</template>

<script
    setup
    lang="ts"
>
import { WtLayout } from '@webitel/ui-sdk/components';
import { watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useChatsStore } from '../../../../../features/chats/store/chats';
import TheChatPreviewsList from './the-chat-previews-list.vue';

const route = useRoute();
const router = useRouter();
const chatsStore = useChatsStore();

// A chat window only exists for a chat opened this session. Redirect a stale URL
// (e.g. after refresh, when openChats is empty) back to the list instead of
// rendering a window for a chat with no preview.
watchEffect(() => {
	const threadId = route.params.threadId as string;
	if (threadId && !chatsStore.isOpen(threadId)) router.replace('/chats');
});
</script>

<style scoped>
.the-chats-workspace {
    display: flex;
    gap: var(--wt-page-body-gap);
    min-height: 0;
}

.the-chat-previews-list {
    overflow-y: auto;
}
</style>