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
            <h4 class="incoming-interaction-preview__title typo-subtitle-2">
                {{ t(`ui.notifications.incoming.title.${preview.kind}`) }}
            </h4>

            <div class="incoming-interaction-preview__identity">
                <wt-avatar
                    :username="preview.name"
                    size="lg"
                />
                <div class="incoming-interaction-preview__identity-text">
                    <p class="incoming-interaction-preview__name typo-body-1">
                        {{ preview.name || t('ui.notifications.incoming.unknownContact') }}
                    </p>
                    <p
                        v-if="preview.identifier"
                        class="incoming-interaction-preview__identifier typo-body-2"
                    >
                        {{ preview.identifier }}
                    </p>
                </div>
            </div>

            <p
                v-if="preview.source"
                class="incoming-interaction-preview__source typo-body-2"
                :title="preview.source.value"
            >
                {{ preview.source.label }}: {{ preview.source.value }}
            </p>

            <p
                v-if="preview.body"
                class="incoming-interaction-preview__message typo-body-2"
            >
                {{ preview.body }}
            </p>

            <div class="incoming-interaction-preview__waiting">
                <div class="incoming-interaction-preview__waiting-row">
                    <span class="typo-body-2">{{ t('ui.notifications.incoming.waitingTime') }}</span>
                    <span class="typo-body-2">{{ formatted }}</span>
                </div>
                <!-- hidden until the backend exposes the queue Max wait time (WS-16 / WS-35) -->
                <div
                    v-if="progress !== undefined"
                    class="incoming-interaction-preview__waiting-track"
                >
                    <div
                        class="incoming-interaction-preview__waiting-bar"
                        :class="`incoming-interaction-preview__waiting-bar--${level}`"
                        :style="{ width: `${progress}%` }"
                    />
                </div>
            </div>
        </div>

        <div class="incoming-interaction-preview__actions">
            <wt-button
                color="success"
                @click="emit('accept')"
            >
                {{ t('ui.notifications.incoming.accept') }}
            </wt-button>
            <wt-button
                color="error"
                @click="emit('decline')"
            >
                {{ t('ui.notifications.incoming.decline') }}
            </wt-button>
        </div>
    </article>
</template>

<script
    setup
    lang="ts"
>
import { WtAvatar, WtButton } from '@webitel/ui-sdk/components';
import { useI18n } from 'vue-i18n';

import type { IncomingInteractionPreview } from '../../types/IncomingInteraction.types';
import { useWaitingTime } from '../composables/useWaitingTime';

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

const { formatted, progress, level } = useWaitingTime(
	() => preview.waitingSince,
	() => preview.maxWaitSec,
);

const onBodyClick = () => {
	if (clickable) emit('bodyClick');
};
</script>

<style scoped>
.incoming-interaction-preview {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    width: 320px;
    padding: var(--spacing-sm);
    border-radius: var(--border-radius, 6px);
    background-color: var(--content-wrapper-color);
    box-shadow: var(--elevation-3, 0 4px 12px rgba(0, 0, 0, 0.15));
}

.incoming-interaction-preview__body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.incoming-interaction-preview__body--clickable {
    cursor: pointer;
}

.incoming-interaction-preview__identity {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
}

.incoming-interaction-preview__identity-text {
    min-width: 0;
}

.incoming-interaction-preview__name,
.incoming-interaction-preview__identifier,
.incoming-interaction-preview__source {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.incoming-interaction-preview__message {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

.incoming-interaction-preview__waiting {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xs, 2px);
}

.incoming-interaction-preview__waiting-row {
    display: flex;
    justify-content: space-between;
}

.incoming-interaction-preview__waiting-track {
    overflow: hidden;
    width: 100%;
    height: 2px;
    border-radius: 1px;
    background-color: var(--secondary-color);
}

.incoming-interaction-preview__waiting-bar {
    height: 100%;
    transition: width 1s linear, background-color 0.3s ease;
}

.incoming-interaction-preview__waiting-bar--low {
    background-color: var(--success-color);
}

.incoming-interaction-preview__waiting-bar--medium {
    background-color: var(--warning-color);
}

.incoming-interaction-preview__waiting-bar--high {
    background-color: var(--error-color);
}

.incoming-interaction-preview__actions {
    display: flex;
    gap: var(--spacing-xs);
    justify-content: flex-end;
}
</style>
