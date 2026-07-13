<template>
    <section class="the-chats-workspace">
        <the-chat-previews-list />
        <router-view />
    </section>
</template>

<script
    setup
    lang="ts"
>
import { watch } from 'vue';
import { useRoute } from 'vue-router';

import { useChatsStore } from '../../../../../features/chats/store/chats';
import TheChatPreviewsList from './the-chat-previews-list.vue';

// Deep-link bridge: this parent persists across threadId changes, so it is the
// one place that turns a URL (paste, back/forward, first load) into an open
// intent. openChat is idempotent and skips a redundant push, so this can't loop.
const route = useRoute();
const { openChat } = useChatsStore();
watch(
	() => route.params.threadId as string,
	(id) => {
		if (id) openChat(id, 'main');
	},
	{
		immediate: true,
	},
);
</script>

<style scoped>
.the-chats-workspace {
    display: flex;
    height: 100%;
    min-height: 0;
}

.the-chat-previews-list {
    flex: 0 0 320px;
    border-right: 1px solid var(--grey-lighten-2);
}
</style>