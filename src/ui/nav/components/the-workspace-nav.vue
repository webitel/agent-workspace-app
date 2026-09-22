<!-- the-workspace-nav.vue -->
<template>
  <nav class="the-workspace-nav">
    <ul class="the-workspace-nav-list">
      <workspace-nav-item
        v-for="(item, index) in navItemsWithBadges"
        :key="item.kind === 'link' ? item.to : `button-${index}`"
        :item="item"
      />
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { navItems } from '../config/navItems.config';
import type { NavBadgeConfig } from '../types/NavItem.types';
import WorkspaceNavItem from './workspace-nav-item.vue';

// TODO: додати лічильники з реальних сторів
const newCallsCount = ref(0);
const newChatsCount = ref(0);

function resolveBadge(to?: string): NavBadgeConfig | undefined {
	if (to === '/calls') {
		return {
			variant: 'danger',
			count: newCallsCount.value,
		};
	}
	if (to === '/chats') {
		return {
			variant: 'success',
			count: newChatsCount.value,
		};
	}
	return undefined;
}

const navItemsWithBadges = computed(() =>
	navItems.map((item) => ({
		...item,
		badge: item.kind === 'link' ? resolveBadge(item.to) : undefined,
	})),
);
</script>

<style scoped>
.the-workspace-nav-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  height: 100%;
  padding: var(--spacing-xs);
}
</style>