<template>
    <nav class="the-workspace-nav">
        <ul class="the-workspace-nav-list">
            <li>
                <router-link to="/calls">Calls</router-link>
            </li>
            <li>
                <router-link to="/chats">Chats</router-link>
            </li>
        </ul>
    </nav>
</template>

<script setup lang="ts">

</script>

<style scoped>
.the-workspace-nav-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}
</style>