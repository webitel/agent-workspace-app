<template>
    <aside
        class="the-task-dock-panel"
        aria-label="Active calls and chats"
    >
        <div class="the-task-dock-panel__lanes">
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
.the-task-dock-panel {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 100;
    pointer-events: none;
}

.the-task-dock-panel__lanes {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    pointer-events: auto;
}
</style>
