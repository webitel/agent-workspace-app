<template>
	<div
		class="last-message-text"
		:class="`last-message-text--${look}`"
	>
		<p class="last-message-text__body typo-body-1">
			{{ text }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/** A last message in its bubble with a tail (Figma 2367:21847). */
const props = withDefaults(
	defineProps<{
		text: string;
		/** Who wrote it; picks the bubble's look. */
		sender: 'client' | 'agent';
		isUnread?: boolean;
	}>(),
	{
		isUnread: false,
	},
);

// AC_02.03.01: only the client's message is coloured while unread; the agent's one has a single look
const look = computed(() => {
	if (props.sender === 'agent') {
		return 'agent';
	}
	return props.isUnread ? 'client-unread' : 'client-read';
});
</script>

<style scoped>
/**
 * the tail's size is the size of its svg halves (8×6 each), the design has no token for it;
 * the bubble moves aside by the tail's width so the tail sits between it and the avatar
 */
.last-message-text {
	--last-message-text-tail-width: 8px;
	--last-message-text-tail-height: 12px;

	position: relative;
	flex: 1 1 0;
	min-width: 0;
	margin-inline-start: var(--last-message-text-tail-width);
	padding: var(--wt-ws-chat-queue-pannel-sizes-last-message-text-padding-y) var(--wt-ws-chat-queue-pannel-sizes-last-message-text-padding-x);
	border-radius: var(--wt-ws-chat-queue-pannel-sizes-last-message-text-border-radius);
}

/**
 * the tail is the bubble's own ::before, so the text's ellipsis overflow never clips it;
 * inherit: the tail has no colour of its own, so every bubble colour change reaches it too
 */
.last-message-text::before {
	position: absolute;
	top: 50%;
	right: 100%;
	width: var(--last-message-text-tail-width);
	height: var(--last-message-text-tail-height);
	background-color: inherit;
	content: '';
	transform: translateY(-50%);
	mask-image: url('../../../app/assets/message-tail/message-tail-top.svg'), url('../../../app/assets/message-tail/message-tail-bottom.svg');
	mask-position: top, bottom;
	mask-size: 100% 50%;
	mask-repeat: no-repeat;
}

.last-message-text--client-unread {
	background-color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-client-unread-background);
	color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-client-unread-color);
}

.last-message-text--client-read {
	background-color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-client-read-background);
	color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-client-read-color);
}

.last-message-text--agent {
	background-color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-agent-read-background);
	color: var(--wt-ws-chat-queue-pannel-colors-last-message-text-agent-read-color);
}

.last-message-text__body {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
