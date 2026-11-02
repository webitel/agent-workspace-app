<template>
    <div class="offer-actions">
        <!-- icon-only per the design, so each action needs an accessible name -->
        <wt-button
            wide
            :size="ComponentSize.SM"
            color="success"
            :icon="acceptIcon"
            :loading="pending === 'accept'"
            :disabled="!!pending"
            :aria-label="t('ui.notifications.offer.accept')"
            @click="emit('accept')"
        />
        <wt-button
            wide
            :size="ComponentSize.SM"
            color="error"
            :icon="declineIcon"
            :loading="pending === 'decline'"
            :disabled="!!pending"
            :aria-label="t('ui.notifications.offer.decline')"
            @click="emit('decline')"
        />
    </div>
</template>

<script
    setup
    lang="ts"
>
import { WtButton } from '@webitel/ui-sdk/components';
import { ComponentSize } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { type OfferAction, OfferKind } from '../../types/Offer.types';

/**
 * Accept and decline. `pending` locks both buttons while the store awaits the
 * producer, which is what keeps the SDK from being asked twice.
 */
const { kind, pending } = defineProps<{
	kind: OfferKind;
	pending?: OfferAction;
}>();

const emit = defineEmits<{
	accept: [];
	decline: [];
}>();

const { t } = useI18n();

const ACCEPT_ICONS: Record<OfferKind, string> = {
	[OfferKind.Call]: 'call',
	[OfferKind.Chat]: 'chat',
	[OfferKind.Task]: 'job--accept',
};

const DECLINE_ICONS: Record<OfferKind, string> = {
	[OfferKind.Call]: 'call-end',
	[OfferKind.Chat]: 'chat-end',
	[OfferKind.Task]: 'job--end',
};

const acceptIcon = computed(() => ACCEPT_ICONS[kind]);
const declineIcon = computed(() => DECLINE_ICONS[kind]);
</script>

<style scoped>
.offer-actions {
    display: flex;
    gap: var(--spacing-sm);
    width: 100%;
}

.offer-actions .wt-button {
    flex: 1 0 0;
}
</style>
