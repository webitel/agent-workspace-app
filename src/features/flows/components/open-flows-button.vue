<template>
	<div class="flows-button" @click="open">
		<wt-divider variant="vertical" />
		<wt-icon class="flows-button__icon" icon="flows" size="sm" />
		<wt-divider variant="vertical" />
	</div>
	<flows-modal
		:is-open="isFlowsPopupOpen"
		@close="close"
	/>
</template>

<script setup lang="ts">
import { WtIcon } from '@webitel/ui-sdk/components';
import { ref } from 'vue';
import FlowsModal from './flows-modal.vue';

const isFlowsPopupOpen = ref(false);

const open = () => {
	isFlowsPopupOpen.value = true;
};

const close = () => {
	isFlowsPopupOpen.value = false;
};
</script>

<style scoped>
.flows-button {
	display: flex;
	gap: var(--spacing-2xs);
	cursor: pointer;
}

.flows-button__icon {
	margin: var(--spacing-2xs);
}
</style>