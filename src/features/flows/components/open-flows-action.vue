<template>
	<div class="flows-action">
		<wt-divider variant="vertical" />
		<wt-button
			color="secondary"
			icon="flows"
			size="xs"
			@click="open"
	/>
		<wt-divider variant="vertical" />
	</div>
	<flows-modal
		:is-open="isFlowsPopupOpen"
		@close="close"
	/>
</template>

<script setup lang="ts">
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
.flows-action {
	display: flex;
	gap: var(--spacing-2xs);
	cursor: pointer;
}
</style>