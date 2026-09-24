<template>
	<section class="the-chat-window">
		<the-chat-thread class="the-chat-window__panel" />
	</section>
</template>

<script
	setup
	lang="ts"
>
// The window frames the open chat; its thread (history, paging, sending) lives
// in its own component so other panels (the processing form) can sit beside it.
import TheChatThread from './the-chat-thread.vue';
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
