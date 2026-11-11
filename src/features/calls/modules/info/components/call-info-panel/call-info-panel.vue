<template>
	<component
		:is="panel"
		v-if="panel"
		:content="content"
	/>
</template>

<script setup lang="ts">
import { type Component, computed } from 'vue';
import { CallDirection } from 'webitel-sdk';

import type { CallInfoPanelContent } from '../../types/CallInfoPanelContent.types';
import InboundCallInfoPanel from './inbound-call-info-panel.vue';
import OutboundCallInfoPanel from './outbound-call-info-panel.vue';

const props = defineProps<{
	content: CallInfoPanelContent;
}>();

// Each direction has its own panel, built from the shared header and fields;
// a call without a known direction shows nothing.
const panelByDirection: Record<CallDirection, Component> = {
	[CallDirection.Inbound]: InboundCallInfoPanel,
	[CallDirection.Outbound]: OutboundCallInfoPanel,
};

const panel = computed(() => {
	const { direction } = props.content;
	return direction ? panelByDirection[direction] : undefined;
});
</script>
