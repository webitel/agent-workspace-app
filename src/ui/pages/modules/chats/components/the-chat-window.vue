<template>
    <section class="the-chat-window">
        <h1>Chat Window</h1>
        <chat-container :messages="[]" />
    </section>
</template>

<script
    setup
    lang="ts"
>
import { ChatContainer } from '@webitel/ui-chats/ui';
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
</style>