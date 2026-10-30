<template>
	<div class="task-top-bar-offer-actions">
		<wt-button
			:disabled="Boolean(pending)"
			:loading="pending === 'accept'"
			:color="ButtonColor.SUCCESS"
			:size="ComponentSize.SM"
			@click="emit('accept')"
		>
			{{ t('ui.notifications.offer.accept') }}
		</wt-button>
		<wt-button
			:disabled="Boolean(pending)"
			:loading="pending === 'decline'"
			:color="ButtonColor.ERROR"
			:size="ComponentSize.SM"
			@click="emit('decline')"
		>
			{{ t('ui.notifications.offer.decline') }}
		</wt-button>
	</div>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
import { ButtonColor, ComponentSize } from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';
import type { OfferAction } from '../notifications/modules/offers/types/Offer.types';

/**
 * @author Oleksandr Palonnyi
 * Accept / Decline for the offer a task window is showing, a call's or a chat's.
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
.task-top-bar-offer-actions {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}
</style>
