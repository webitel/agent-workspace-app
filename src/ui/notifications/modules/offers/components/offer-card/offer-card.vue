<template>
    <article
        class="offer-card"
        :class="`offer-card--${content.kind}`"
    >
        <div
            class="offer-card__body"
            :class="{ 'offer-card__body--clickable': clickable }"
            @click="onBodyClick"
        >
            <offer-kind-chip :kind="content.kind" />

            <offer-identity
                :name="content.name"
                :additional-contacts="content.additionalContacts"
                :identifier="content.identifier"
                :channel="channelSource"
            />

            <offer-last-message
                v-if="content.body"
                :text="content.body"
            />

            <offer-waiting-time
                :waiting-since="content.waitingSince"
                :max-wait-sec="content.maxWaitSec"
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
            :kind="content.kind"
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
	type OfferCardContent,
	OfferKind,
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
	content,
	clickable = false,
	pending,
} = defineProps<{
	content: OfferCardContent;
	clickable?: boolean;
	/** The action currently in flight, if any — both buttons lock while it runs. */
	pending?: OfferAction;
}>();

const emit = defineEmits<{
	accept: [];
	decline: [];
	bodyClick: [];
}>();

const isChat = computed(() => content.kind === OfferKind.Chat);

/** Chats name their gateway inside the identity block, beside the username. */
const channelSource = computed(() =>
	isChat.value ? content.source : undefined,
);

/** Calls name their queue below the wait bar, where the variables block sits. */
const queueSource = computed(() => (isChat.value ? undefined : content.source));

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
