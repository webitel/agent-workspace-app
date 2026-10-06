<template>
    <p
        class="chat-preview-footer typo-caption"
        :title="queueName"
    >
        <span class="chat-preview-footer__text">
            <span class="typo-caption-bold">
                {{ t('objects.queue.queue', 1) }}:
            </span>
            {{ queueName }}
        </span>
        <!-- room for the expand control (more info, copy chat id): laid out, not built -->
        <wt-icon
            class="chat-preview-footer__expand"
            icon="arrow-down"
            :size="ComponentSize.XS"
            aria-hidden="true"
        />
    </p>
</template>

<script
    lang="ts"
    setup
>
import { WtIcon } from '@webitel/ui-sdk/components';
import { ComponentSize } from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';

defineProps<{
	queueName: string;
}>();

const { t } = useI18n();
</script>

<style scoped>
.chat-preview-footer {
    display: flex;
    gap: var(--spacing-2xs, 4px);
    align-items: center;
    justify-content: space-between;
}

.chat-preview-footer__text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.chat-preview-footer__expand {
    flex: none;
}
</style>
