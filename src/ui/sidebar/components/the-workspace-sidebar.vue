<template>
    <section v-if="isOpen" class="workspace-sidebar">
        <div class="workspace-sidebar__header">
            <h1>Workspace Sidebar</h1>
            <wt-icon-btn icon="close" @click="close()" />
        </div>
    </section>
</template>

<script setup lang="ts">
import { WtIconBtn } from '@webitel/ui-sdk/components';
import { storeToRefs } from 'pinia';
import { useWorkspaceSidebarStore } from '../store/workspace-sidebar';

const sidebarStore = useWorkspaceSidebarStore();
const { isOpen } = storeToRefs(sidebarStore);
const { close } = sidebarStore;
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
