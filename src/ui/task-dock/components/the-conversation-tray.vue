<template>
    <aside
        class="the-conversation-tray"
        aria-label="Active calls and chats"
    >
        <div class="the-conversation-tray__lanes">
            <task-dock-call-lane />
            <task-dock-chat-lane />
        </div>
    </aside>
</template>

<script
    setup
    lang="ts"
>
import TaskDockCallLane from './task-dock-call-lane.vue';
import TaskDockChatLane from './task-dock-chat-lane.vue';
</script>

<style scoped>

.the-conversation-tray__lanes {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
}
</style>
