<template>
	<li :class="item.wrapperClass">
			<router-link
					v-if="item.kind === 'link'"
					v-slot="{ navigate, isActive, isExactActive }"
					:to="item.to"
					custom
			>
					<wt-button
						variant="text"
						class="workspace-nav-item__button"
						:icon="item.icon"
						:class="{ active: item.exact ? isExactActive : isActive }"
						:badge="item.badge?.count ? String(item.badge.count) : undefined"
						:badge-severity="item.badge?.variant"
						badge-absolute-position
						@click="() => navigate()"
					/>
			</router-link>

			<wt-button
					v-else
					variant="text"
					class="workspace-nav-item__button"
					:icon="item.icon"
					@click="item.onClick"
			/>
	</li>
</template>

<script setup lang="ts">
import type { NavItemConfig } from '../types/NavItem.types';

defineProps<{
	item: NavItemConfig;
}>();
</script>

<style scoped>
.the-workspace-nav-list__tasks {
	margin-bottom: auto;
}

.workspace-nav-item__button {
	--icon-color: var(--wt-ws-sidebar-menu-colors-button-text-color);
}

.workspace-nav-item__button.active {
	--icon-color: var(--wt-ws-sidebar-menu-colors-button-filled-color);
	background: var(--wt-ws-sidebar-menu-colors-button-filled-background);
}

.workspace-nav-item__button:hover {
	--icon-color: var(--wt-ws-sidebar-menu-colors-button-text-color);
	background: var(--wt-ws-sidebar-menu-colors-button-text-hover-background);
}
</style>
