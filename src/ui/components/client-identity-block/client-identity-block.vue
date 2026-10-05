<template>
    <div
        class="client-identity-block"
        :class="`client-identity-block--${size}`"
    >
        <div class="client-identity-block__avatar">
            <wt-avatar
                :username="name"
                :size="size"
            />
            <!-- interaction timer ring: laid out here, drawn by its own story -->
            <slot name="ring" />
        </div>
        <div class="client-identity-block__info">
            <div class="client-identity-block__name-row">
                <p class="client-identity-block__name typo-body-1-bold">
                    {{ name || t('ui.clientIdentity.unknownContact') }}
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
                class="client-identity-block__identifier"
                :class="size === 'lg' ? 'typo-body-1' : 'typo-caption'"
            >
                {{ identifier }}
            </p>
            <p
                v-if="channel"
                class="client-identity-block__channel typo-caption"
                :title="channel.value"
            >
                <wt-icon
                    v-if="channel.icon"
                    :icon="channel.icon"
                    :size="ComponentSize.XS"
                />
                <span class="client-identity-block__channel-label">
                    {{ channel.label }}:
                </span>
                {{ channel.value }}
            </p>
        </div>
    </div>
</template>

<script
    setup
    lang="ts"
>
import { WtAvatar, WtChip, WtIcon } from '@webitel/ui-sdk/components';
import { ChipColor, ComponentSize } from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';

import type { ClientIdentityChannel } from './types/ClientIdentityBlock.types';

/**
 * Who the client is, for any interaction: the Figma "Client Identity Block".
 * `lg` is the centred card layout (offer card, call dock), `sm` the compact row
 * used in lists. Channel-neutral: `identifier` is a masked phone number for
 * calls and a username for chats, and `channel` names the chat gateway.
 */
defineProps<{
	size: 'sm' | 'lg';
	name?: string;
	additionalContacts?: number;
	identifier?: string;
	channel?: ClientIdentityChannel;
}>();

const { t } = useI18n();
</script>

<style scoped>
.client-identity-block {
    display: flex;
    gap: var(--spacing-xs);
    min-width: 0;
}

.client-identity-block--lg {
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.client-identity-block--sm {
    align-items: center;
}

.client-identity-block__avatar {
    position: relative;
    flex: none;
}

.client-identity-block__info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xs, 4px);
    min-width: 0;
}

.client-identity-block--lg .client-identity-block__info {
    align-items: center;
    max-width: 100%;
}

.client-identity-block__name-row {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
    max-width: 100%;
}

.client-identity-block--lg .client-identity-block__name-row {
    justify-content: center;
}

.client-identity-block__name,
.client-identity-block__identifier,
.client-identity-block__channel {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.client-identity-block__channel {
    display: flex;
    gap: var(--spacing-2xs, 4px);
    align-items: center;
    max-width: 100%;
}

.client-identity-block__channel-label {
    font-weight: 500;
}
</style>
