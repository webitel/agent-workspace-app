<template>
	<div class="call-panel">
		<call-info-panel :content="content" />
		<!-- identification is the next PR: until then no contact is ever found -->
		<contact-identification :contact-ids="[]" />
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Call } from 'webitel-sdk';
import CallInfoPanel from '../../../../features/calls/components/call-info-panel/call-info-panel.vue';
import { toCallInfoPanelContent } from '../../../../features/calls/scripts/toCallInfoPanelContent';
import ContactIdentification from '../../components/contact/contact-identification.vue';

// The call open on the page; the sidebar shows this panel only while it exists.
const props = defineProps<{
	call: Call;
}>();

const content = computed(() => toCallInfoPanelContent(props.call));
</script>

<style scoped>
.call-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
}
</style>
