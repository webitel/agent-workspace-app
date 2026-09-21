<template>
    <Teleport to="body">
        <div class="the-notifications-layer">
            <!-- most urgent first: an offer has a deadline, a toast does not -->
            <the-offers />
            <wt-notifications-bar />
        </div>
    </Teleport>
</template>

<script
    setup
    lang="ts"
>
import { WtNotificationsBar } from '@webitel/ui-sdk/components';

import TheOffers from '../modules/offers/components/the-offers.vue';
</script>

<style scoped>
/*
 * One stacking context for everything that appears in the corner. Each surface
 * used to fix itself to the viewport independently, so they overlapped instead
 * of stacking.
 */
.the-notifications-layer {
    position: fixed;
    top: var(--spacing-md);
    right: var(--spacing-md);
    z-index: 1100;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--spacing-sm);
    /* the layer spans the corner; only its children should catch clicks */
    pointer-events: none;
}

.the-notifications-layer > * {
    pointer-events: auto;
}

/*
 * PrimeVue's Toast pins itself to the viewport corner (`position: fixed` with
 * its own top/right). Inside this layer it has to flow like any other child, or
 * it ignores the stack and lands back on top of the offers.
 */
.the-notifications-layer :deep(.p-toast) {
    position: static;
    width: auto;
}
</style>
