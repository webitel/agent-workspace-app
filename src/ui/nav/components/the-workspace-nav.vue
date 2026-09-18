<template>
    <nav class="the-workspace-nav">
        <ul class="the-workspace-nav__group">
            <sidebar-menu-button
                v-for="item in topMenuItems"
                :key="item.id"
                v-bind="item"
            />
        </ul>

        <ul class="the-workspace-nav__group the-workspace-nav__group--bottom">
            <sidebar-menu-button
                v-for="item in bottomMenuItems"
                :key="item.id"
                v-bind="item"
            />
        </ul>
    </nav>
</template>

<script setup lang="ts">
import type { ButtonColor } from '@webitel/ui-sdk/enums';
import { useNumpadStore } from '../../numpad/store/numpad';
import SidebarMenuButton from './sidebar-menu-button.vue';

/**
 * A menu item is either a route link (`to`) or an action (`onClick`) — see
 * `sidebar-menu-button.vue`, which renders the same button either way.
 */
interface SidebarMenuItem {
	id: string;
	icon: string;
	color?: ButtonColor;
	to?: string;
	onClick?: () => void;
}

const numpadStore = useNumpadStore();

// TODO: placeholder nav links until the actual top-group content is defined
const topMenuItems: SidebarMenuItem[] = [
	{
		id: 'calls',
		to: '/calls',
		icon: 'call',
		color: 'success',
	},
	{
		id: 'chats',
		to: '/chats',
		icon: 'chat',
	},
];

// TODO: placeholder actions until the rest of the bottom-group content is defined
const bottomMenuItems: SidebarMenuItem[] = [
	{
		id: 'numpad',
		icon: 'call',
		color: 'success',
		onClick: () => numpadStore.toggle(),
	},
];
</script>

<style scoped>
.the-workspace-nav {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--spacing-xs);
    background-color: var(--blue-darken-3);
}

.the-workspace-nav__group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.the-workspace-nav__group--bottom {
    margin-top: auto;
}
</style>
