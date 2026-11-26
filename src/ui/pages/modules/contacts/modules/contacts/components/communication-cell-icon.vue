<template>
	<span class="communication-cell-icon">
		<wt-icon
			:icon="icon"
			:size="ComponentSize.SM"
			:color="color"
		/>
	</span>
</template>

<script setup lang="ts">
/**
 * @author Polina Sukhorukova
 * The icon of a contacts table communication column, in the same box as the
 * SM icon button of the phone cell (an SM icon with --spacing-xs padding), so
 * chat, email and empty rows line up with a phone row
 * [WS-177](https://webitel.atlassian.net/browse/WS-177)
 */
import { ComponentSize, type IconColor } from '@webitel/ui-sdk/enums';

defineProps<{
	icon: string;
	color: IconColor;
}>();
</script>

<style scoped>
.communication-cell-icon {
	display: flex;
	flex-shrink: 0;
	padding: var(--spacing-xs);
}
</style>
