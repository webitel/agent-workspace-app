<template>
    <main class="the-agent-workspace">
        <the-workspace-header />
        <div class="workspace-content-nav-wrapper">
            <the-workspace-nav />
            <section class="workspace-content-wrapper">
                <router-view class="workspace-content" />
                <the-workspace-sidebar />
                <the-task-dock-panel />
            </section>
        </div>
        <the-notifications />
    </main>
</template>

<script
    setup
    lang="ts"
>
import TheWorkspaceHeader from '../../ui/header/components/the-workspace-header.vue';
import TheWorkspaceNav from '../../ui/nav/components/the-workspace-nav.vue';
import TheNotifications from '../../ui/notifications/components/the-notifications.vue';
import { useSocketNotifications } from '../../ui/notifications/composables/useSocketNotifications';
import TheWorkspaceSidebar from '../../ui/sidebar/components/the-workspace-sidebar.vue';
import TheTaskDockPanel from '../../ui/task-dock/components/the-task-dock-panel.vue';

const { subscribeToWebSocketEvents } = useSocketNotifications();

subscribeToWebSocketEvents();
</script>

<style scoped>
.the-agent-workspace {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: var(--grey-lighten-4);
}

.workspace-content-nav-wrapper {
    display: flex;
    height: 100%;
    min-height: 0;
}

.workspace-content-wrapper {
    position: relative;
    /* task dock panel is absolute */
    flex: 1;
    display: flex;
    gap: var(--spacing-sm);

    .the-task-dock-panel {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 100;
        pointer-events: none;
    }
}

.workspace-content {
    flex: 1;
    display: flex;
    background-color: var(--white);
}
</style>