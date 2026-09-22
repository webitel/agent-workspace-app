<template>
    <nav class="the-workspace-nav">
        <ul class="the-workspace-nav-list">
            <li>
                <router-link
                    v-slot="{ navigate, isExactActive }"
                    to="/"
                    custom
                >
                    <wt-button
                        icon="ws-navigation-home-page" 
                        variant="text"
                        :class="{ active: isExactActive  }"
                         @click="() => navigate()"
                    />
                </router-link>
            </li>
            <li>
                <router-link
                    v-slot="{ navigate, isActive }"
                    to="/calls"
                    custom
                >
                    <wt-button
                        icon="ws-navigation-calls"
                        variant="text"
                        :class="{ active: isActive }"
                         @click="() => navigate()"
                    />
                </router-link>
            </li>
            <li>
                <router-link
                    v-slot="{ navigate, isActive }"
                    to="/chats"
                    custom
                >
                    <wt-button
                        icon="ws-navigation-chats"
                        variant="text"
                        :class="{ active: isActive }"
                         @click="() => navigate()"
                    />
                </router-link>
            </li>
            <!--<li>
                <router-link
                    v-slot="{ navigate, isActive }"
                    to="/"
                    custom
                >
                    <wt-button
                        icon="ws-navigation-mentions"
                        variant="text"
                        :class="{ active: isActive }"
                         @click="() => navigate()"
                    />
                </router-link>
            </li>-->
            <!--<li>
                <router-link
                    v-slot="{ navigate, isActive }"
                    to="/"
                    custom
                >
                    <wt-button
                        icon="ws-navigation-email"
                        variant="text"
                        :class="{ active: isActive }"
                         @click="() => navigate()"
                    />
                </router-link>
            </li>-->
            <li class="the-workspace-nav-list__tasks">
                <router-link
                    v-slot="{ navigate, isActive }"
                    to="/tasks"
                    custom
                >
                    <wt-button
                        icon="ws-navigation-tasks"
                        variant="text"
                        :class="{ active: isActive }"
                         @click="() => navigate()"
                    />
                </router-link>
            </li>

            <!--<li>
                <router-link
                    v-slot="{ navigate, isActive }"
                    to="/chats"
                    custom
                >
                    <wt-button
                        icon="ws-navigation-knowledge-base"
                        variant="text"
                        :class="{ active: isActive }"
                         @click="() => navigate()"
                    />
                </router-link>
            </li>-->
            <li>
                <router-link
                    v-slot="{ navigate, isActive }"
                    to="/contacts"
                    custom
                >
                    <wt-button
                        icon="ws-navigation-contacts"
                        variant="text"
                        :class="{ active: isActive }"
                         @click="() => navigate()"
                    />
                </router-link>
            </li>
            <li>
                <router-link
                    v-slot="{ navigate, isActive }"
                    to="/history"
                    custom
                >
                    <wt-button
                        icon="ws-navigation-history"
                        variant="text"
                        :class="{ active: isActive }"
                         @click="() => navigate()"
                    />
                </router-link>
            </li>
            <li>
                <wt-button 
                    icon="ws-navigation-calls"
                    variant="text"
                />
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
    background: var(--brand-gradient-45);
    height: 100%;
    padding: var(--spacing-xs);
}

.the-workspace-nav-list__tasks {
    margin-bottom: auto;
}

.p-button :deep(span) {
    fill: var(--wt-ws-sidebar-menu-colors-button-text-color);
}


.p-button.active {
    background: var(--wt-ws-sidebar-menu-colors-button-filled-background);
}

.p-button.active :deep(span) {
    fill: var(--wt-ws-sidebar-menu-colors-button-filled-color);
}

.p-button:hover {
    background: var(--wt-ws-sidebar-menu-colors-button-text-hover-background);
}

.p-button:hover :deep(span){
    fill: var(--wt-ws-sidebar-menu-colors-button-text-color);
}
</style>
