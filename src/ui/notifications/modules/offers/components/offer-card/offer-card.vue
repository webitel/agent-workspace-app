<template>
    <article
        class="offer-card"
        :class="`offer-card--${preview.kind}`"
    >
        <div
            class="offer-card__body"
            :class="{ 'offer-card__body--clickable': clickable }"
            @click="onBodyClick"
        >
            <offer-kind-chip :kind="preview.kind" />

            <offer-identity
                :name="preview.name"
                :additional-contacts="preview.additionalContacts"
                :identifier="preview.identifier"
                :channel="channelSource"
            />

            <offer-last-message
                v-if="preview.body"
                :text="preview.body"
            />

            <offer-waiting-time
                :waiting-since="preview.waitingSince"
                :max-wait-sec="preview.maxWaitSec"
            />

            <template v-if="queueSource">
                <wt-divider />
                <offer-source-line
                    class="offer-card__queue"
                    :source="queueSource"
                />
            </template>
        </div>

        <wt-divider />

        <offer-actions
            :kind="preview.kind"
            :pending="pending"
            @accept="emit('accept')"
            @decline="emit('decline')"
        />
    </article>
</template>

<script
    setup
    lang="ts"
>
import { WtDivider } from '@webitel/ui-sdk/components';
import { computed } from 'vue';

import {
	type OfferAction,
	OfferKind,
	type OfferPreview,
} from '../../types/Offer.types';
import OfferActions from './offer-actions.vue';
import OfferIdentity from './offer-identity.vue';
import OfferKindChip from './offer-kind-chip.vue';
import OfferLastMessage from './offer-last-message.vue';
import OfferSourceLine from './offer-source-line.vue';
import OfferWaitingTime from './offer-waiting-time.vue';

/**
 * The offer card from DES-727, composed from the pieces above. It owns the
 * layout and the one piece of channel logic the pieces cannot see: where the
 * offer's single `source` belongs.
 */
const {
	preview,
	clickable = false,
	pending,
} = defineProps<{
	preview: OfferPreview;
	clickable?: boolean;
	/** The action currently in flight, if any — both buttons lock while it runs. */
	pending?: OfferAction;
}>();

const emit = defineEmits<{
	accept: [];
	decline: [];
	bodyClick: [];
}>();

const isChat = computed(() => preview.kind === OfferKind.Chat);

/** Chats name their gateway inside the identity block, beside the username. */
const channelSource = computed(() =>
	isChat.value ? preview.source : undefined,
);

/** Calls name their queue below the wait bar, where the variables block sits. */
const queueSource = computed(() => (isChat.value ? undefined : preview.source));

const onBodyClick = () => {
	if (clickable) emit('bodyClick');
};
</script>

<style scoped>
.offer-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: center;
    width: 320px;
    padding: var(--spacing-sm);
    border-radius: var(--border-radius, 8px);
    background-color: var(--content-wrapper-color);
    box-shadow: var(--elevation-3, 0 0 11px rgba(0, 0, 0, 0.15));
}

.offer-card__body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: center;
    width: 100%;
}

.offer-card__body--clickable {
    cursor: pointer;
}

/* the queue spans the card, unlike the gateway line centred in the identity */
.offer-card__queue {
    width: 100%;
}
</style>
