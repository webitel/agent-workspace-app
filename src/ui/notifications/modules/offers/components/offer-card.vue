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
            <wt-chip
                class="offer-card__kind"
                :color="ChipColor.INFO"
            >
                <wt-icon
                    icon="bell"
                    :size="ComponentSize.SM"
                />
                {{ t(`ui.notifications.offer.title.${preview.kind}`) }}
            </wt-chip>

            <div class="offer-card__identity">
                <wt-avatar
                    :username="preview.name"
                    size="lg"
                />
                <div class="offer-card__name-row">
                    <p class="offer-card__name typo-body-1-bold">
                        {{ preview.name || t('ui.notifications.offer.unknownContact') }}
                    </p>
                    <!-- identification can match several contacts; this is the remainder -->
                    <wt-chip
                        v-if="preview.additionalContacts"
                        :color="ChipColor.MAIN"
                    >
                        +{{ preview.additionalContacts }}
                    </wt-chip>
                </div>
                <p
                    v-if="preview.identifier"
                    class="offer-card__identifier typo-body-1"
                >
                    {{ preview.identifier }}
                </p>
                <p
                    v-if="channelSource"
                    class="offer-card__channel typo-caption"
                    :title="channelSource.value"
                >
                    <wt-icon
                        icon="chat"
                        :size="ComponentSize.XS"
                    />
                    <span class="offer-card__channel-label">
                        {{ channelSource.label }}:
                    </span>
                    {{ channelSource.value }}
                </p>
            </div>

            <p
                v-if="preview.body"
                class="offer-card__message typo-body-1"
            >
                {{ preview.body }}
            </p>

            <!-- hidden outright when the channel has no trustworthy epoch (WS-35) -->
            <div
                v-if="hasWaitingTime"
                class="offer-card__waiting"
            >
                <div class="offer-card__waiting-row">
                    <span class="typo-caption-bold">{{ t('ui.notifications.offer.waitingTime') }}</span>
                    <span class="typo-caption">{{ formatted }}</span>
                </div>
                <!-- hidden until the backend exposes the queue Max wait time (WS-16 / WS-35) -->
                <div
                    v-if="progress !== undefined"
                    class="offer-card__waiting-track"
                >
                    <span
                        v-for="segment in WAITING_SEGMENTS"
                        :key="segment"
                        class="offer-card__waiting-segment"
                        :class="segment <= filledSegments
                            ? `offer-card__waiting-segment--${level}`
                            : undefined"
                    />
                </div>
            </div>

            <template v-if="queueSource">
                <wt-divider />
                <p
                    class="offer-card__queue typo-caption"
                    :title="queueSource.value"
                >
                    <span class="offer-card__queue-label">
                        {{ queueSource.label }}:
                    </span>
                    {{ queueSource.value }}
                </p>
            </template>
        </div>

        <wt-divider />

        <div class="offer-card__actions">
            <!-- icon-only per the design, so the action needs an accessible name -->
            <wt-button
                wide
                :size="ComponentSize.SM"
                color="success"
                :icon="acceptIcon"
                :aria-label="t('ui.notifications.offer.accept')"
                @click="emit('accept')"
            />
            <wt-button
                wide
                :size="ComponentSize.SM"
                color="error"
                :icon="declineIcon"
                :aria-label="t('ui.notifications.offer.decline')"
                @click="emit('decline')"
            />
        </div>
    </article>
</template>

<script
    setup
    lang="ts"
>
import {
	WtAvatar,
	WtButton,
	WtChip,
	WtDivider,
	WtIcon,
} from '@webitel/ui-sdk/components';
import { ChipColor, ComponentSize } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWaitingTime } from '../composables/useWaitingTime';
import { OfferKind, type OfferPreview } from '../types/Offer.types';

/** The design draws the queue-wait bar as four discrete segments, not a fill. */
const WAITING_SEGMENTS = [
	1,
	2,
	3,
	4,
];

const { preview, clickable = false } = defineProps<{
	preview: OfferPreview;
	clickable?: boolean;
}>();

const emit = defineEmits<{
	accept: [];
	decline: [];
	bodyClick: [];
}>();

const { t } = useI18n();

const { hasWaitingTime, formatted, progress, level } = useWaitingTime(
	() => preview.waitingSince,
	() => preview.maxWaitSec,
);

const filledSegments = computed(() =>
	progress.value === undefined
		? 0
		: Math.ceil((progress.value / 100) * WAITING_SEGMENTS.length),
);

const isChat = computed(() => preview.kind === OfferKind.Chat);

/** Chats name their gateway inside the identity block, beside the username. */
const channelSource = computed(() =>
	isChat.value ? preview.source : undefined,
);

/** Calls name their queue below the wait bar, where the variables block sits. */
const queueSource = computed(() => (isChat.value ? undefined : preview.source));

const acceptIcon = computed(() => (isChat.value ? 'chat' : 'call'));
const declineIcon = computed(() => (isChat.value ? 'chat-end' : 'call-end'));

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

.offer-card__kind {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
}

.offer-card__identity {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xs, 4px);
    align-items: center;
    width: 100%;
}

.offer-card__name-row {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
    justify-content: center;
    max-width: 100%;
}

.offer-card__name,
.offer-card__identifier,
.offer-card__channel,
.offer-card__queue {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.offer-card__channel {
    display: flex;
    gap: var(--spacing-2xs, 4px);
    align-items: center;
}

.offer-card__channel-label,
.offer-card__queue-label {
    font-weight: 500;
}

.offer-card__queue {
    width: 100%;
}

/* the client's last message, styled as an incoming bubble */
.offer-card__message {
    display: -webkit-box;
    overflow: hidden;
    width: 100%;
    padding: var(--spacing-2xs, 4px) var(--spacing-xs);
    border-radius: var(--border-radius, 8px);
    background-color: var(--chat-client-message-background-color, var(--secondary-color-50, #d5e3f6));
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

.offer-card__waiting {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xs, 4px);
    width: 100%;
}

.offer-card__waiting-row {
    display: flex;
    justify-content: space-between;
    padding: 0 var(--spacing-2xs, 4px);
}

.offer-card__waiting-track {
    display: flex;
    gap: 0;
    width: 100%;
    height: 2px;
}

.offer-card__waiting-segment {
    flex: 1 0 0;
    min-width: 0;
    background-color: var(--secondary-color, #d1d5e0);
    transition: background-color 0.3s ease;
}

.offer-card__waiting-segment--low {
    background-color: var(--success-color);
}

.offer-card__waiting-segment--medium {
    background-color: var(--warning-color);
}

.offer-card__waiting-segment--high {
    background-color: var(--error-color);
}

.offer-card__actions {
    display: flex;
    gap: var(--spacing-sm);
    width: 100%;
}

.offer-card__actions .wt-button {
    flex: 1 0 0;
}
</style>
