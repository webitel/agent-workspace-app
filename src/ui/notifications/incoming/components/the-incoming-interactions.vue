<template>
    <div
        v-if="store.hasInteractions"
        class="the-incoming-interactions"
    >
        <incoming-interaction-preview
            v-for="interaction in store.interactions"
            :key="interaction.id"
            :preview="toValue(interaction.preview)"
            :clickable="!!interaction.onBodyClick"
            @accept="store.accept(interaction.id)"
            @decline="store.decline(interaction.id)"
            @body-click="store.openBody(interaction.id)"
        />
    </div>
</template>

<script
    setup
    lang="ts"
>
import { toValue } from 'vue';

import { useIncomingInteractionsStore } from '../store/incomingInteractions';
import IncomingInteractionPreview from './incoming-interaction-preview.vue';

const store = useIncomingInteractionsStore();
</script>

<style scoped>
/* top-right corner per AC_06.01.01 — placement owned by `the-notifications-layer` */
.the-incoming-interactions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}
</style>
