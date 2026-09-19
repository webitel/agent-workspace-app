<template>
    <div class="offer-identity">
        <wt-avatar
            :username="name"
            size="lg"
        />
        <div class="offer-identity__name-row">
            <p class="offer-identity__name typo-body-1-bold">
                {{ name || t('ui.notifications.offer.unknownContact') }}
            </p>
            <!-- identification can match several contacts; this is the remainder -->
            <wt-chip
                v-if="additionalContacts"
                :color="ChipColor.MAIN"
            >
                +{{ additionalContacts }}
            </wt-chip>
        </div>
        <p
            v-if="identifier"
            class="offer-identity__identifier typo-body-1"
        >
            {{ identifier }}
        </p>
        <offer-source-line
            v-if="channel"
            :source="channel"
            icon="chat"
        />
    </div>
</template>

<script
    setup
    lang="ts"
>
import { WtAvatar, WtChip } from '@webitel/ui-sdk/components';
import { ChipColor } from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';

import type { OfferSource } from '../types/Offer.types';
import OfferSourceLine from './offer-source-line.vue';

/**
 * Who is calling or writing. Channel-neutral: `identifier` is a masked phone
 * number for calls and a username for chats, and `channel` is only ever passed
 * for chats, which name their gateway beside the contact.
 */
defineProps<{
	name?: string;
	additionalContacts?: number;
	identifier?: string;
	channel?: OfferSource;
}>();

const { t } = useI18n();
</script>

<style scoped>
.offer-identity {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xs, 4px);
    align-items: center;
    width: 100%;
}

.offer-identity__name-row {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
    justify-content: center;
    max-width: 100%;
}

.offer-identity__name,
.offer-identity__identifier {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
</style>
