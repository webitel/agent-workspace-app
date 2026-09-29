<template>
	<wt-icon
		class="ringing-indicator"
		icon="wt-ringing-bell"
		aria-hidden="true"
	/>
</template>

<script
	setup
	lang="ts"
>
import { WtIcon } from '@webitel/ui-sdk/components';
</script>

<style scoped>
/**
 * @author Oleksandr Palonnyi
 * The Figma "Ringing Indicator" (Dialer DES-721) is 96px, and the largest
 * `wt-icon` size (6xl) is 80px, so the size is set here instead
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
.ringing-indicator {
	width: 96px;
	height: 96px;
}
</style>
