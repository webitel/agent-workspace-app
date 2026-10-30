<template>
	<section class="the-closed-chat-thread">
		<!-- read-only: the agent has left, so there is nothing to send or mark read -->
		<chat-thread
			v-if="thread"
			:thread="thread"
			:messages="messages"
			:self-member-id="selfMemberId"
			:mode="ChatThreadMode.Readonly"
			:has-more="hasMore"
			@load-more="closedChat.loadMore"
		/>
	</section>
</template>

<script
	setup
	lang="ts"
>
import { ChatThread, ChatThreadMode } from '@webitel/ui-chats/v2';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { findSelfMemberId } from '../../../scripts/findSelfMemberId';
import { useChatAccountStore } from '../../../store/chat-account';
import { useClosedChatStore } from '../store/closed-chat';

const route = useRoute();
const threadId = computed(() => route.params.threadId as string);
const accountStore = useChatAccountStore();

// Resolve reactively so the window rebinds when threadId changes; a destructured
// storeToRefs would stay pinned to the first chat's store.
const closedChat = computed(() => useClosedChatStore(threadId.value));
const thread = computed(() => closedChat.value.thread);
const messages = computed(() => closedChat.value.messages);
const hasMore = computed(() => closedChat.value.hasMore);
// the agent's own messages are still told from the client's after they left
const selfMemberId = computed(() =>
	findSelfMemberId(thread.value, accountStore.account),
);
</script>

<style scoped>
.the-closed-chat-thread {
	flex: 1;
	display: flex;
	flex-direction: column;
	width: 100%;
	min-height: 0;
}

.chat-thread {
	flex: 1;
	min-height: 0;
}
</style>
