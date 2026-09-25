<template>
	<div
		v-if="numpadStore.isOpen"
		class="the-numpad-panel"
	>
		<the-numpad
			:initial-number="numpadStore.prefilledNumber"
			@call="onCall"
		/>
	</div>
</template>

<script
	setup
	lang="ts"
>
import { useNumpadStore } from '../store/numpad';
import TheNumpad from './the-numpad.vue';

const numpadStore = useNumpadStore();

function onCall() {
	numpadStore.close();
}
</script>

<style scoped>
.the-numpad-panel {
	position: absolute;
	bottom: var(--spacing-sm);
	left: var(--spacing-sm);
	z-index: 101;
	border-radius: var(--p-border-radius-lg);
	background-color: var(--content-wrapper-color);
	box-shadow: var(--elevation-10);
}
</style>
