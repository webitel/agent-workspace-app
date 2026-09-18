<template>
    <li class="sidebar-menu-button">
        <router-link
            v-if="to"
            :to="to"
        >
            <wt-button
                :icon="icon"
                :color="color"
            />
        </router-link>

        <wt-button
            v-else
            :icon="icon"
            :color="color"
            @click="emit('click')"
        />
    </li>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
import type { ButtonColor } from '@webitel/ui-sdk/enums';

/**
 * Same visual atom for both purposes: a route link when `to` is given
 * (navigation), a plain action button otherwise (e.g. opening the numpad).
 */
defineProps<{
	icon: string;
	color?: ButtonColor;
	to?: string;
}>();

const emit = defineEmits<{
	click: [];
}>();
</script>
