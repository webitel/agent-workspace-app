<template>
    <Teleport to="body">
        <div class="the-notifications">
            <article
                v-for="notification in notificationsStore.notifications"
                :key="notification.id"
                class="the-notifications__item"
            >
                <h4
                    v-if="notification.title"
                    class="the-notifications__title"
                >
                    {{ notification.title }}
                </h4>
                <p class="the-notifications__text">{{ notification.text }}</p>
                <div
                    v-if="notification.actions.length"
                    class="the-notifications__actions"
                >
                    <wt-button
                        v-for="action in notification.actions"
                        :key="action.label"
                        :color="action.color"
                        @click="notificationsStore.runAction(notification.id, action)"
                    >
                        {{ action.label }}
                    </wt-button>
                </div>
            </article>
        </div>
    </Teleport>
</template>

<script
    setup
    lang="ts"
>
import { WtButton } from '@webitel/ui-sdk/components';

import { useNotificationsStore } from '../store/notifications';

const notificationsStore = useNotificationsStore();
</script>

<style scoped>
.the-notifications {
    position: fixed;
    top: var(--spacing-md);
    right: var(--spacing-md);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    max-width: 360px;
}

.the-notifications__item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
    border-radius: var(--border-radius, 6px);
    background-color: var(--white);
    box-shadow: var(--elevation-3, 0 4px 12px rgba(0, 0, 0, 0.15));
}

.the-notifications__actions {
    display: flex;
    gap: var(--spacing-xs);
    justify-content: flex-end;
}
</style>
