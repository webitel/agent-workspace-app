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
import { computed } from 'vue';
import { useNavBadges } from '../composables/useNavBadges';
import { navItems } from '../config/navItems.config';
import WorkspaceNavItem from './workspace-nav-item.vue';

const { badgesByRoute } = useNavBadges();

const navItemsWithBadges = computed(() =>
	navItems.map((item) => ({
		...item,
		badge: item.kind === 'link' ? badgesByRoute.value[item.to] : undefined,
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
	background: var(--wt-ws-sidebar-menu-colors-background);
}
</style>
