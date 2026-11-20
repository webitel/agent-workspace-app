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
                :channel="content.source"
            />

            <offer-last-message
                v-if="content.body"
                :text="content.body"
                :name="content.name"
            />

            <offer-waiting-time
                :waiting-since="content.waitingSince"
                :max-wait-sec="content.maxWaitSec"
                :is-countdown="content.isCountdown"
            />

            <!-- AC_06.01.06: neither a queue nor variables — no block at all -->
            <template v-if="hasDetails">
                <wt-divider />
                <div class="offer-card__details">
                    <offer-source-line
                        v-if="queueSource"
                        class="offer-card__queue"
                        :source="queueSource"
                    />
                    <offer-variables
                        v-if="content.variables?.length"
                        :variables="content.variables"
                    />
                </div>
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
import { useI18n } from 'vue-i18n';

import type {
	OfferAction,
	OfferCardContent,
	OfferSource,
} from '../../types/Offer.types';
import OfferActions from './offer-actions.vue';
import OfferIdentity from './offer-identity.vue';
import OfferKindChip from './offer-kind-chip.vue';
import OfferLastMessage from './offer-last-message.vue';
import OfferSourceLine from './offer-source-line.vue';
import OfferVariables from './offer-variables.vue';
import OfferWaitingTime from './offer-waiting-time.vue';

/**
 * The offer card from DES-727, composed from the pieces above. It owns the
 * layout: a chat's gateway sits in the identity block, and the queue heads the
 * variables block below the wait bar for both channels.
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

const { t } = useI18n();

const queueSource = computed<OfferSource | undefined>(() =>
	content.queueName
		? {
				label: t('ui.notifications.offer.queue'),
				value: content.queueName,
			}
		: undefined,
);

const hasDetails = computed(
	() => Boolean(queueSource.value) || Boolean(content.variables?.length),
);

const onBodyClick = () => {
	if (clickable) emit('bodyClick');
};
</script>

<style scoped>
.offer-card {
    display: flex;
    flex-direction: column;
    gap: var(--wt-ws-incoming-interaction-preview-sizes-root-gap);
    align-items: center;
    width: 320px;
    padding: var(--wt-ws-incoming-interaction-preview-sizes-root-padding-y) var(--wt-ws-incoming-interaction-preview-sizes-root-padding-x);
    border-radius: var(--wt-ws-incoming-interaction-preview-sizes-root-border-radius);
    background-color: var(--wt-ws-incoming-interaction-preview-colors-root-background);
    box-shadow: var(--elevation-3, 0 0 11px rgba(0, 0, 0, 0.15));
}

.offer-card__body {
    display: flex;
    flex-direction: column;
    gap: var(--wt-ws-incoming-interaction-preview-sizes-root-gap);
    align-items: center;
    width: 100%;
}

.offer-card__body--clickable {
    cursor: pointer;
}

.offer-card__details {
    display: flex;
    flex-direction: column;
    width: 100%;
}

/* the queue spans the card, unlike the gateway line centred in the identity */
.offer-card__queue {
    width: 100%;
}
</style>
