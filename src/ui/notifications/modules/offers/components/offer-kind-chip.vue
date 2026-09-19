<template>
    <wt-chip
        class="offer-kind-chip"
        :color="ChipColor.INFO"
    >
        <wt-icon
            icon="bell"
            :size="ComponentSize.SM"
        />
        {{ t(`ui.notifications.offer.title.${kind}`) }}
    </wt-chip>
</template>

<script
    setup
    lang="ts"
>
import { WtChip, WtIcon } from '@webitel/ui-sdk/components';
import { ChipColor, ComponentSize } from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';

import type { OfferKind } from '../types/Offer.types';

/** The card's header: what is being offered, per DES-727. */
defineProps<{
	kind: OfferKind;
}>();

const { t } = useI18n();
</script>

<style scoped>
.offer-kind-chip {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
}
</style>
