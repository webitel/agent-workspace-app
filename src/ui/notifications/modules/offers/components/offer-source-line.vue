<template>
    <p
        class="offer-source-line typo-caption"
        :title="source.value"
    >
        <wt-icon
            v-if="icon"
            :icon="icon"
            :size="ComponentSize.XS"
        />
        <span class="offer-source-line__label">
            {{ source.label }}:
        </span>
        {{ source.value }}
    </p>
</template>

<script
    setup
    lang="ts"
>
import { WtIcon } from '@webitel/ui-sdk/components';
import { ComponentSize } from '@webitel/ui-sdk/enums';

import type { OfferSource } from '../types/Offer.types';

/**
 * `${label}: ${value}` — the chat's gateway and the call's queue are the same
 * line with a different icon, so both channels render through this.
 */
defineProps<{
	source: OfferSource;
	icon?: string;
}>();
</script>

<style scoped>
.offer-source-line {
    display: flex;
    gap: var(--spacing-2xs, 4px);
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.offer-source-line__label {
    font-weight: 500;
}
</style>
