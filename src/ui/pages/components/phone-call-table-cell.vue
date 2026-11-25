<template>
	<div class="phone-call-table-cell">
		<phone-call-button
			:number="phoneNumber"
			:disabled="!phoneNumber || isCalling"
			@click="call(phoneNumber)"
		/>
		<p>{{ phoneNumber }}</p>
	</div>
</template>

<script setup lang="ts">
import { useOutboundCall } from '../../../features/calls/composables/useOutboundCall';
import PhoneCallButton from '../../components/phone-call-button/phone-call-button.vue';

defineProps<{
	phoneNumber?: string;
}>();

const { isCalling, call } = useOutboundCall();
</script>

<style scoped>
.phone-call-table-cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}
</style>
