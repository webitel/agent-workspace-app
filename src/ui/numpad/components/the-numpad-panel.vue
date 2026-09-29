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
import { useOutboundCallStore } from '../../../features/calls/store/outboundCall';
import { useNumpadStore } from '../store/numpad';
import TheNumpad from './the-numpad.vue';

const numpadStore = useNumpadStore();
const outboundCallStore = useOutboundCallStore();

function onCall(destination: string) {
	outboundCallStore.start(destination);
	// numpadStore.close();
}
</script>

<style scoped>
/**
 * @author Oleksandr Palonnyi
 * The left offset is an interim value that clears the nav: the nav has no width token yet
 * to position against
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
.the-numpad-panel {
	position: fixed;
	bottom: var(--spacing-xl);
	left: var(--spacing-xl);
	z-index: 101;
	border-radius: var(--p-border-radius-lg);
	background-color: var(--content-wrapper-color);
	box-shadow: var(--elevation-10);
}
</style>
