<template>
	<section class="the-chat-window">
		<the-chat-conversation class="the-chat-window__panel" />
	</section>
</template>

<script
	setup
	lang="ts"
>
// The window frames the open chat; the conversation itself lives in its own
// component so other panels (the processing form) can sit beside it.
import TheChatConversation from './the-chat-conversation.vue';
</script>

<style scoped>
.the-chat-window {
	flex: 1;
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	min-height: 0;
}

.the-chat-window__panel {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
}
</style>
