<template>
    <p class="offer-last-message typo-body-1">
        {{ text }}
    </p>
</template>

<script
    setup
    lang="ts"
>
/** The customer's last message — chats only. */
defineProps<{
	text: string;
}>();
</script>

<style scoped>
/* styled as an incoming bubble, so it reads as the customer's words */
.offer-last-message {
    display: -webkit-box;
    overflow: hidden;
    width: 100%;
    padding: var(--spacing-2xs, 4px) var(--spacing-xs);
    border-radius: var(--border-radius, 8px);
    background-color: var(--chat-client-message-background-color, var(--secondary-color-50, #d5e3f6));
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}
</style>
