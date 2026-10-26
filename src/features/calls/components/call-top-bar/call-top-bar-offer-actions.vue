<template>
	<div class="call-top-bar-offer-actions">
		<wt-button
			:disabled="Boolean(pending)"
			:loading="pending === 'accept'"
			color="success"
			size="sm"
			@click="emit('accept')"
		>
			{{ t('ui.notifications.offer.accept') }}
		</wt-button>
		<wt-button
			:disabled="Boolean(pending)"
			:loading="pending === 'decline'"
			color="error"
			size="sm"
			@click="emit('decline')"
		>
			{{ t('ui.notifications.offer.decline') }}
		</wt-button>
	</div>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
import { useI18n } from 'vue-i18n';
import type { OfferAction } from '../../../../ui/notifications/modules/offers/types/Offer.types';

/**
 * @author Oleksandr Palonnyi
 * `pending` locks both buttons while an action runs, like the offer card's,
 * so the SDK is never asked twice
 * [WS-105](https://webitel.atlassian.net/browse/WS-105)
 */
defineProps<{
	pending?: OfferAction;
}>();

const emit = defineEmits<{
	accept: [];
	decline: [];
}>();

const { t } = useI18n();
</script>

<style scoped>
.call-top-bar-offer-actions {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}
</style>
