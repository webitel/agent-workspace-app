<template>
	<div
		v-if="info"
		class="call-panel"
	>
		<call-panel-info :info="info" />
		<!-- identification is the next PR: until then no contact is ever found -->
		<contact-identification :contact-ids="[]" />
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import CallPanelInfo from '../../../../features/calls/components/call-panel-info/call-panel-info.vue';
import { toCallPanelInfo } from '../../../../features/calls/scripts/toCallPanelInfo';
import { useCallsStore } from '../../../../features/calls/store/calls';
import ContactIdentification from '../../components/contact/contact-identification.vue';

const route = useRoute();
const callsStore = useCallsStore();

const call = computed(() =>
	callsStore.getCallById(route.params.callId as string),
);

const info = computed(() => call.value && toCallPanelInfo(call.value));
</script>

<style scoped>
.call-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
}
</style>
