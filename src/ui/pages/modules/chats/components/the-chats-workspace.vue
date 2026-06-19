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
import TheChatPreviewsList from './the-chat-previews-list.vue';
</script>

<style scoped></style>