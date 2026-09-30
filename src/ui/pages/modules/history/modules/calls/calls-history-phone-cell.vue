<template>
	<div class="calls-history-phone-cell">
		<!-- TODO: start a call to this number (AC_19.01.05) -->
		<wt-button
			variant="text"
			class="calls-history-phone-cell__button"
			icon="ws-navigation-calls"
		/>
		<p>{{ phoneNumber }}</p>
	</div>
</template>

<script setup lang="ts">
import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { computed } from 'vue';
import { CallDirection } from 'webitel-sdk';

const props = defineProps<{
	item: EngineHistoryCall;
}>();

const phoneNumber = computed(() => {
	const { direction, to, from, destination } = props.item;

	return direction === CallDirection.Outbound
		? to?.number || destination
		: from?.number;
});
</script>

<style scoped>
.calls-history-phone-cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.calls-history-phone-cell__button {
	--icon-color: var(--wt-ws-dialer-colors-connection-feedback-block-call-status-indicator-success-color);
}

.calls-history-phone-cell__button:hover {
		background: var(--wt-ws-dialer-colors-connection-feedback-block-call-status-indicator-success-background);

}
</style>