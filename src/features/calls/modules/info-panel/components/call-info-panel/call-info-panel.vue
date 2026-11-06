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

const props = defineProps<{
	content: CallInfoPanelContent;
}>();

// Each direction has its own panel, built from the shared header and fields;
// a direction without one shows nothing (the outbound one comes with US_16.03).
const panelByDirection: Partial<Record<CallDirection, Component>> = {
	[CallDirection.Inbound]: InboundCallInfoPanel,
};

const panel = computed(() => {
	const { direction } = props.content;
	return direction ? panelByDirection[direction] : undefined;
});
</script>
