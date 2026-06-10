<template>
    <main class="the-agent-workspace">
        <the-workspace-header />
        <section class="workspace-content-wrapper">
            <the-workspace-nav />
            <section class="workspace-content">
                <router-view />
            </section>
            <the-workspace-sidebar />
        </section>
    </main>
</template>

<script
    setup
    lang="ts"
>
import TheWorkspaceHeader from '../../ui/header/components/the-workspace-header.vue';
import TheWorkspaceNav from '../../ui/nav/components/the-workspace-nav.vue';
import TheWorkspaceSidebar from '../../ui/sidebar/components/the-workspace-sidebar.vue';

import { useSocketNotifications } from '../../ui/notifications/composables/useSocketNotifications';

const { subscribeToWebSocketEvents } = useSocketNotifications();

subscribeToWebSocketEvents();
</script>

<style scoped>
.the-agent-workspace {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.workspace-content-wrapper {
    flex: 1;
    display: flex;
}

.workspace-content {
    flex: 1;
    display: flex;
}
</style>