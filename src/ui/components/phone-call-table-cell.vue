<template>
	<div class="phone-call-table-cell">
		<wt-button
			:variant="ButtonVariant.TEXT"
			class="phone-call-table-cell__button"
			icon="calls"
			:disabled="!phoneNumber || isCalling"
			@click="startCall"
		/>
		<p>{{ phoneNumber }}</p>
	</div>
</template>

<script setup lang="ts">
import { ButtonVariant } from '@webitel/ui-sdk/enums';
import { ref } from 'vue';
import { useCallsStore } from '../../features/calls/store/calls';

const props = defineProps<{
	phoneNumber?: string;
}>();

const callsStore = useCallsStore();

const isCalling = ref(false);

async function startCall() {
	isCalling.value = true;
	try {
		await callsStore.call({
			destination: props.phoneNumber,
		});
	} finally {
		isCalling.value = false;
	}
}
</script>

<style scoped>
.phone-call-table-cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.phone-call-table-cell__button {
	flex-shrink: 0;
	--icon-color: var(--wt-ws-dialer-colors-connection-feedback-block-call-status-indicator-success-color);
}

.phone-call-table-cell__button:hover {
	background: var(--wt-ws-dialer-colors-connection-feedback-block-call-status-indicator-success-background);
}
</style>