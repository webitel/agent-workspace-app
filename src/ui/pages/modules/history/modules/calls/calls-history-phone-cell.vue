<template>
	<div class="calls-history-phone-cell">
		<wt-button
			variant="text"
			class="calls-history-phone-cell__button"
			icon="ws-navigation-calls"
			:disabled="!phoneNumber || isCalling"
			@click="startCall"
		/>
		<p>{{ phoneNumber }}</p>
	</div>
</template>

<script setup lang="ts">
import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { computed, ref } from 'vue';
import { CallDirection } from 'webitel-sdk';
import { useCallsStore } from '../../../../../../features/calls/store/calls';

const props = defineProps<{
	item: EngineHistoryCall;
}>();

const callsStore = useCallsStore();

const isCalling = ref(false);

const phoneNumber = computed(() => {
	const { direction, to, from, destination } = props.item;

	return direction === CallDirection.Outbound
		? to?.number || destination
		: from?.number;
});

async function startCall() {
	isCalling.value = true;
	try {
		await callsStore.call({
			destination: phoneNumber.value,
		});
	} finally {
		isCalling.value = false;
	}
}
</script>

<style scoped>
.calls-history-phone-cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.calls-history-phone-cell__button {
	flex-shrink: 0;
	--icon-color: var(--wt-ws-dialer-colors-connection-feedback-block-call-status-indicator-success-color);
}

.calls-history-phone-cell__button:hover {
	background: var(--wt-ws-dialer-colors-connection-feedback-block-call-status-indicator-success-background);
}
</style>