<template>
	<div class="self-assigned-call-phone-cell">
		<wt-button
			class="self-assigned-call-phone-cell__answer"
			icon="ws-navigation-calls"
			:size="ComponentSize.SM"
			:color="ButtonColor.SUCCESS"
			:icon-color="IconColor.SUCCESS"
			:variant="ButtonVariant.TEXT"
			:loading="loading"
			width-by-content
			@click="emit('answer')"
		/>
		<p>{{ phoneNumber }}</p>
	</div>
</template>

<script setup lang="ts">
import {
	ButtonColor,
	ButtonVariant,
	ComponentSize,
	IconColor,
} from '@webitel/ui-sdk/enums';

/**
 * Looks like the shared phone cell, but its icon answers the waiting call
 * rather than dialling the number (AC_12.03.02): the table intercepts it.
 * [WS-39](https://webitel.atlassian.net/browse/WS-39)
 */
defineProps<{
	phoneNumber?: string;
	loading?: boolean;
}>();

const emit = defineEmits<{
	answer: [];
}>();
</script>

<style scoped>
.self-assigned-call-phone-cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.self-assigned-call-phone-cell__answer {
	flex-shrink: 0;
	--icon-color: var(--wt-ws-dialer-colors-connection-feedback-block-call-status-indicator-success-color);
}

.self-assigned-call-phone-cell__answer:hover {
	background: var(--wt-ws-dialer-colors-connection-feedback-block-call-status-indicator-success-background);
}
</style>
