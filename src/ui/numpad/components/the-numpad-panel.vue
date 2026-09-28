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
/**
 * @author Oleksandr Palonnyi
 * The task dock is laid over the page with pointer-events: none so the page stays clickable
 * around it; the numpad re-enables them to receive input.
 * The left offset is an interim value that clears the nav: the nav has no width token yet
 * to position against
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
.the-numpad-panel {
	position: fixed;
	bottom: var(--spacing-xl);
	left: var(--spacing-xl);
	z-index: 101;
	pointer-events: auto;
	border-radius: var(--p-border-radius-lg);
	background-color: var(--content-wrapper-color);
	box-shadow: var(--elevation-10);
}
</style>
