<template>
	<div
		v-if="content"
		class="call-panel"
	>
		<call-info-panel :content="content" />
		<!-- identification is the next PR: until then no contact is ever found -->
		<contact-identification :contact-ids="[]" />
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import CallInfoPanel from '../../../../features/calls/components/call-info-panel/call-info-panel.vue';
import { toCallInfoPanelContent } from '../../../../features/calls/scripts/toCallInfoPanelContent';
import { useCallsStore } from '../../../../features/calls/store/calls';
import ContactIdentification from '../../components/contact/contact-identification.vue';

const route = useRoute();
const callsStore = useCallsStore();

const call = computed(() =>
	callsStore.getCallById(route.params.callId as string),
);

const content = computed(
	() => call.value && toCallInfoPanelContent(call.value),
);
</script>

<style scoped>
.call-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
}
</style>
