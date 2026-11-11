<template>
	<wt-icon-btn
		:icon="icon"
		@click="toggle"
	/>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useWorkspaceSidebarStore } from '../../sidebar/store/workspace-sidebar';

const sidebarStore = useWorkspaceSidebarStore();
const { isOpen } = storeToRefs(sidebarStore);
const { toggle } = sidebarStore;

const icon = computed(() =>
	isOpen.value ? 'ws-sidebar-open' : 'ws-sidebar-close',
);
</script>
