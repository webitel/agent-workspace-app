<template>
    <wt-layout v-if="isOpen" :default-width="320" class="workspace-sidebar">
        <div class="workspace-sidebar__header">
            <h1>Workspace Sidebar</h1>
            <wt-icon-btn icon="close" @click="close()" />
        </div>
    </wt-layout>
</template>

<script setup lang="ts">
import { WtLayout } from '@webitel/ui-sdk/components';
import { storeToRefs } from 'pinia';
import { useWorkspaceSidebarStore } from '../store/workspace-sidebar';

const sidebarStore = useWorkspaceSidebarStore();
const { isOpen } = storeToRefs(sidebarStore);
const { close } = sidebarStore;
</script>

<style scoped>
.workspace-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
</style>
