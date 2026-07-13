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