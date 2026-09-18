<template>
    <section v-if="sidebarStore.isOpen" class="workspace-sidebar">
        <div class="workspace-sidebar__header">
            <h1>Workspace Sidebar</h1>
            <wt-icon-btn icon="close" @click="sidebarStore.close()" />
        </div>
    </section>
</template>

<script setup lang="ts">
import { WtIconBtn } from '@webitel/ui-sdk/components';

import { useWorkspaceSidebarStore } from '../store/workspace-sidebar';

const sidebarStore = useWorkspaceSidebarStore();
</script>

<style scoped>
.workspace-sidebar {
    width: 280px;
    background-color: var(--content-wrapper-color);
}

.workspace-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
</style>