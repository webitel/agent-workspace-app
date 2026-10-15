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
  background: var(--wt-ws-conversation-tray-colors-root-background);
  border-radius: var(--wt-ws-conversation-tray-sizes-root-border-radius);
  padding: var(--wt-ws-conversation-tray-sizes-root-padding-y) var(--wt-ws-conversation-tray-sizes-root-padding-x);
}

.the-task-dock-panel__lanes {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
}
</style>
