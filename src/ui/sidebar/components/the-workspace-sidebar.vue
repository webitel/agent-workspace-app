<template>
    <wt-layout v-if="isOpen" :default-width="320" class="workspace-sidebar">
        <div v-if="content" class="workspace-sidebar__content">
            <component :is="content.component" v-bind="content.props" />
        </div>
    </wt-layout>
</template>

<script setup lang="ts">
import { WtLayout } from '@webitel/ui-sdk/components';
import { storeToRefs } from 'pinia';
import { useSidebarContent } from '../composables/useSidebarContent';
import { useWorkspaceSidebarStore } from '../store/workspace-sidebar';

const { isOpen } = storeToRefs(useWorkspaceSidebarStore());

const { content } = useSidebarContent();
</script>

<style scoped>
.workspace-sidebar__content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: var(--spacing-sm);
}
</style>