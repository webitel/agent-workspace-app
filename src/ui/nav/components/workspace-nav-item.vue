<template>
	<li :class="item.wrapperClass">
			<router-link
					v-if="item.kind === 'link'"
					v-slot="{ navigate, isActive, isExactActive }"
					:to="item.to"
					custom
			>
					<wt-button
							:icon="item.icon"
							variant="text"
							:class="{ active: item.exact ? isExactActive : isActive }"
							@click="() => navigate()"
					/>
					<!--TODO: після змін у компоненті wt-badge або wt-badge-new перевірити відображення-->
					<wt-badge-new
						v-if="item.badge && item.badge?.count > 0"
						:severity="item.badge?.variant"
						size="xs"
					>
						{{ item.badge?.count }}
					</wt-badge-new>
			</router-link>

			<wt-button
					v-else
					:icon="item.icon"
					variant="text"
			/>
	</li>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
import type { NavItemConfig } from '../types/NavItem.types';

defineProps<{
	item: NavItemConfig;
}>();
</script>

<style scoped>
li {
	position: relative;
}

.the-workspace-nav-list__tasks {
	margin-bottom: auto;
}

.wt-button :deep(span) {
	position: relative;
}

.wt-button :deep(span) {
	fill: var(--wt-ws-sidebar-menu-colors-button-text-color);
}

.wt-button.active {
	background: var(--wt-ws-sidebar-menu-colors-button-filled-background);
}

.wt-button.active :deep(span) {
	fill: var(--wt-ws-sidebar-menu-colors-button-filled-color);
}

.wt-button:hover {
  background: var(--wt-ws-sidebar-menu-colors-button-text-hover-background);
}

.wt-button:hover :deep(span) {
	fill: var(--wt-ws-sidebar-menu-colors-button-text-color);
}

.wt-badge {
	position: absolute;
	top: 0;
	right: 0;
}
</style>
