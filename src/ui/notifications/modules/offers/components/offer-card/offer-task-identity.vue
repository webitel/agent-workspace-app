<template>
    <div class="offer-task-identity">
        <p class="offer-task-identity__name typo-heading-4">
            {{ name || t('ui.notifications.offer.unknownContact') }}
        </p>
        <p
            v-if="destination"
            class="offer-task-identity__destination typo-body-1"
        >
            {{ destination }}
        </p>
    </div>
</template>

<script
    setup
    lang="ts"
>
import { useI18n } from 'vue-i18n';

/**
 * Who the task is for: the queue member's name and destination. Unlike the
 * call and chat identity, the task offer mock shows no avatar and aligns left.
 */
defineProps<{
	name?: string;
	destination?: string;
}>();

const { t } = useI18n();
</script>

<style scoped>
.offer-task-identity {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xs, 4px);
    width: 100%;
}

.offer-task-identity__name,
.offer-task-identity__destination {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
</style>
