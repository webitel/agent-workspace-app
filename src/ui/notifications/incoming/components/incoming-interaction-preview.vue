<template>
    <article
        class="incoming-interaction-preview"
        :class="`incoming-interaction-preview--${preview.kind}`"
    >
        <div
            class="incoming-interaction-preview__body"
            :class="{ 'incoming-interaction-preview__body--clickable': clickable }"
            @click="onBodyClick"
        >
            <wt-chip
                class="incoming-interaction-preview__kind"
                color="primary"
            >
                <wt-icon
                    icon="bell"
                    :size="ComponentSize.SM"
                />
                {{ t(`ui.notifications.incoming.title.${preview.kind}`) }}
            </wt-chip>

            <div class="incoming-interaction-preview__identity">
                <wt-avatar
                    :username="preview.name"
                    size="lg"
                />
                <div class="incoming-interaction-preview__name-row">
                    <p class="incoming-interaction-preview__name typo-body-1-bold">
                        {{ preview.name || t('ui.notifications.incoming.unknownContact') }}
                    </p>
                    <!-- identification can match several contacts; this is the remainder -->
                    <wt-chip
                        v-if="preview.additionalContacts"
                        color="main"
                    >
                        +{{ preview.additionalContacts }}
                    </wt-chip>
                </div>
                <p
                    v-if="preview.identifier"
                    class="incoming-interaction-preview__identifier typo-body-1"
                >
                    {{ preview.identifier }}
                </p>
                <p
                    v-if="channelSource"
                    class="incoming-interaction-preview__channel typo-caption"
                    :title="channelSource.value"
                >
                    <wt-icon
                        icon="chat"
                        :size="ComponentSize.XS"
                    />
                    <span class="incoming-interaction-preview__channel-label">
                        {{ channelSource.label }}:
                    </span>
                    {{ channelSource.value }}
                </p>
            </div>

            <p
                v-if="preview.body"
                class="incoming-interaction-preview__message typo-body-1"
            >
                {{ preview.body }}
            </p>

            <!-- hidden outright when the channel has no trustworthy epoch (WS-35) -->
            <div
                v-if="hasWaitingTime"
                class="incoming-interaction-preview__waiting"
            >
                <div class="incoming-interaction-preview__waiting-row">
                    <span class="typo-caption-bold">{{ t('ui.notifications.incoming.waitingTime') }}</span>
                    <span class="typo-caption">{{ formatted }}</span>
                </div>
                <!-- hidden until the backend exposes the queue Max wait time (WS-16 / WS-35) -->
                <div
                    v-if="progress !== undefined"
                    class="incoming-interaction-preview__waiting-track"
                >
                    <span
                        v-for="segment in WAITING_SEGMENTS"
                        :key="segment"
                        class="incoming-interaction-preview__waiting-segment"
                        :class="segment <= filledSegments
                            ? `incoming-interaction-preview__waiting-segment--${level}`
                            : undefined"
                    />
                </div>
            </div>

            <template v-if="queueSource">
                <wt-divider />
                <p
                    class="incoming-interaction-preview__queue typo-caption"
                    :title="queueSource.value"
                >
                    <span class="incoming-interaction-preview__queue-label">
                        {{ queueSource.label }}:
                    </span>
                    {{ queueSource.value }}
                </p>
            </template>
        </div>

        <wt-divider />

        <div class="incoming-interaction-preview__actions">
            <!-- icon-only per the design, so the action needs an accessible name -->
            <wt-button
                wide
                :size="ComponentSize.SM"
                color="success"
                :icon="acceptIcon"
                :aria-label="t('ui.notifications.incoming.accept')"
                @click="emit('accept')"
            />
            <wt-button
                wide
                :size="ComponentSize.SM"
                color="error"
                :icon="declineIcon"
                :aria-label="t('ui.notifications.incoming.decline')"
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
import { ComponentSize } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import {
	type IncomingInteractionPreview,
	InteractionKind,
} from '../../types/IncomingInteraction.types';
import { useWaitingTime } from '../composables/useWaitingTime';

/** The design draws the queue-wait bar as four discrete segments, not a fill. */
const WAITING_SEGMENTS = [
	1,
	2,
	3,
	4,
];

const { preview, clickable = false } = defineProps<{
	preview: IncomingInteractionPreview;
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

const isChat = computed(() => preview.kind === InteractionKind.Chat);

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
.incoming-interaction-preview {
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

.incoming-interaction-preview__body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: center;
    width: 100%;
}

.incoming-interaction-preview__body--clickable {
    cursor: pointer;
}

.incoming-interaction-preview__kind {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
}

.incoming-interaction-preview__identity {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xs, 4px);
    align-items: center;
    width: 100%;
}

.incoming-interaction-preview__name-row {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
    justify-content: center;
    max-width: 100%;
}

.incoming-interaction-preview__name,
.incoming-interaction-preview__identifier,
.incoming-interaction-preview__channel,
.incoming-interaction-preview__queue {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.incoming-interaction-preview__channel {
    display: flex;
    gap: var(--spacing-2xs, 4px);
    align-items: center;
}

.incoming-interaction-preview__channel-label,
.incoming-interaction-preview__queue-label {
    font-weight: 500;
}

.incoming-interaction-preview__queue {
    width: 100%;
}

/* the client's last message, styled as an incoming bubble */
.incoming-interaction-preview__message {
    display: -webkit-box;
    overflow: hidden;
    width: 100%;
    padding: var(--spacing-2xs, 4px) var(--spacing-xs);
    border-radius: var(--border-radius, 8px);
    background-color: var(--chat-client-message-background-color, var(--secondary-color-50, #d5e3f6));
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

.incoming-interaction-preview__waiting {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xs, 4px);
    width: 100%;
}

.incoming-interaction-preview__waiting-row {
    display: flex;
    justify-content: space-between;
    padding: 0 var(--spacing-2xs, 4px);
}

.incoming-interaction-preview__waiting-track {
    display: flex;
    gap: 0;
    width: 100%;
    height: 2px;
}

.incoming-interaction-preview__waiting-segment {
    flex: 1 0 0;
    min-width: 0;
    background-color: var(--secondary-color, #d1d5e0);
    transition: background-color 0.3s ease;
}

.incoming-interaction-preview__waiting-segment--low {
    background-color: var(--success-color);
}

.incoming-interaction-preview__waiting-segment--medium {
    background-color: var(--warning-color);
}

.incoming-interaction-preview__waiting-segment--high {
    background-color: var(--error-color);
}

.incoming-interaction-preview__actions {
    display: flex;
    gap: var(--spacing-sm);
    width: 100%;
}

.incoming-interaction-preview__actions .wt-button {
    flex: 1 0 0;
}
</style>
