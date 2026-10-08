<template>
	<div class="ringing-indicator">
		<wt-icon
			icon="wt-ringing-bell"
			:color="IconColor.SUCCESS"
		/>
	</div>
</template>

<script
	setup
	lang="ts"
>
import { WtIcon } from '@webitel/ui-sdk/components';
import { IconColor } from '@webitel/ui-sdk/enums';
</script>

<style scoped>
.ringing-indicator {
	display: flex;
	padding: var(--spacing-sm);
	border-radius: 50%;
	background-color: var(--success-light-color);
}
</style>
