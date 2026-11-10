<template>
	<div class="phone-call-table-cell">
    <wt-button
        class="phone-call-table-cell__button"
        icon="ws-navigation-calls"
        :size="ComponentSize.SM"
        :color="ButtonColor.SUCCESS"
        :icon-color="IconColor.SUCCESS"
        :variant="ButtonVariant.TEXT"
        :disabled="!phoneNumber || isCalling"
        width-by-content
        @click="startCall"
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
import { ref } from 'vue';
import { useOutboundCallAttemptsStore } from '../../../features/calls/store/outboundCallAttempts';

const props = defineProps<{
	phoneNumber?: string;
}>();

/**
 * @author Oleksandr Palonnyi
 * Dials through an outbound attempt rather than `callsStore.call`, so the agent
 * gets the outbound call card and can follow the call (AC_20.03.01); a bare
 * `callsStore.call` places the call with no UI of its own until it is answered
 * [WTEL-WS-27](https://webitel.atlassian.net/browse/WTEL-WS-27)
 */
const outboundCallAttemptsStore = useOutboundCallAttemptsStore();

const isCalling = ref(false);

async function startCall() {
	isCalling.value = true;
	try {
		await outboundCallAttemptsStore.start(props.phoneNumber);
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