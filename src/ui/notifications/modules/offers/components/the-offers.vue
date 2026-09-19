<template>
    <div
        v-if="store.hasOffers"
        class="the-offers"
    >
        <offer-card
            v-for="offer in store.offers"
            :key="offer.id"
            :preview="toValue(offer.preview)"
            :clickable="!!offer.onBodyClick"
            @accept="store.accept(offer.id)"
            @decline="store.decline(offer.id)"
            @body-click="store.openBody(offer.id)"
        />
    </div>
</template>

<script
    setup
    lang="ts"
>
import { toValue } from 'vue';

import { useOffersStore } from '../store/offers';
import OfferCard from './offer-card.vue';

const store = useOffersStore();
</script>

<style scoped>
/* top-right corner per AC_06.01.01 — placement owned by `the-notifications-layer` */
.the-offers {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}
</style>
