<template>
	<section class="the-chat-thread">
		<chat-thread
			v-if="thread"
			:thread="thread"
			:messages="messages"
			:self-member-id="selfMemberId"
			:mode="props.mode"
			:has-more="hasMore"
			:actions="chatActions"
			@load-more="chatSession.loadMore"
			@send="chatSession.sendText"
			@attach="chatSession.sendFiles"
			@seen="handleSeen"
		/>
	</section>
</template>

<script
	setup
	lang="ts"
>
import {
	ChatComposerAction,
	ChatThread,
	ChatThreadMode,
	type MessageModel,
} from '@webitel/ui-chats/v2';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useChatSessionStore } from '../../../../../features/chats/store/chat-session';

const props = withDefaults(
	defineProps<{
		/** decided by the chat window, which knows the task behind the chat */
		mode?: ChatThreadMode;
	}>(),
	{
		mode: ChatThreadMode.Readonly,
	},
);

const route = useRoute();
const threadId = computed(() => route.params.threadId as string);

// Resolve reactively so the window rebinds when threadId changes; a destructured
// storeToRefs would stay pinned to the first chat's store.
const chatSession = computed(() => useChatSessionStore(threadId.value));
const thread = computed(() => chatSession.value.thread);
const messages = computed(() => chatSession.value.messages);
const hasMore = computed(() => chatSession.value.hasMore);
const selfMemberId = computed(() => chatSession.value.selfMemberId);

const chatActions = [
	ChatComposerAction.Attach,
	ChatComposerAction.Emoji,
	ChatComposerAction.Send,
];

// ui-chats never calls SDK methods; the store holds IMessage instances, which
// can mark themselves read.
function handleSeen(message: MessageModel) {
	void (
		message as MessageModel & {
			markRead?: () => Promise<void>;
		}
	).markRead?.();
}
</script>

<style scoped>
.the-chat-thread {
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
