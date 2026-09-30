<template>
    <main class="the-agent-workspace">
        <wt-page>
            <template #header>
                <the-workspace-header />
            </template>
            <the-workspace-nav />
            <section class="workspace-content-wrapper">
                <router-view class="workspace-content" />
                <the-workspace-sidebar />
                <the-task-dock-panel />
            </section>
        </wt-page>
        <the-notifications-layer />
    </main>
</template>

<script
    setup
    lang="ts"
>
import { WtPage } from '@webitel/ui-sdk/components';

import TheWorkspaceHeader from '../../ui/header/components/the-workspace-header.vue';
import TheWorkspaceNav from '../../ui/nav/components/the-workspace-nav.vue';
import TheNotificationsLayer from '../../ui/notifications/components/the-notifications-layer.vue';
import { useSocketNotifications } from '../../ui/notifications/composables/useSocketNotifications';
import TheWorkspaceSidebar from '../../ui/sidebar/components/the-workspace-sidebar.vue';
import TheTaskDockPanel from '../../ui/task-dock/components/the-task-dock-panel.vue';

const { subscribeToWebSocketEvents } = useSocketNotifications();

subscribeToWebSocketEvents();
</script>

<style scoped>
.the-agent-workspace {
    height: 100vh;
}

/* groups the layouts; the nav rail stays out of it */
.workspace-content-wrapper {
    position: relative;
    /* task dock panel is absolute */
    flex: 1;
    display: flex;
    gap: var(--wt-page-body-gap);
    min-width: 0;

    .the-task-dock-panel {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 100;
        pointer-events: none;
    }
}

/* routed page root: either a wt-layout or a group of them */
.workspace-content {
    flex: 1 1 0;
}
</style>
