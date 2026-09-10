<template>
    <nav class="the-workspace-nav">
        <ul class="the-workspace-nav-list">
            <li>
                <router-link to="/calls">
                    <wt-button icon="call" color="success" />
                </router-link>
            </li>
            <li>
                <router-link to="/chats">
                    <wt-button icon="chat" />
                </router-link>
            </li>
        </ul>
    </nav>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
</script>

<style scoped>
.the-workspace-nav-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    background-color: var(--blue-darken-3);
    height: 100%;
    padding: var(--spacing-xs);
}
</style>
