<template>
	<div class="communication-cell-empty">
		<span class="communication-cell-empty__icon">
			<wt-icon
				:icon="icon"
				:size="ComponentSize.SM"
				:color="IconColor.DISABLED"
			/>
		</span>
		<span class="typo-body-2">{{ text }}</span>
	</div>
</template>

<script setup lang="ts">
/**
 * @author Polina Sukhorukova
 * The "No phone / No chat / No email" state shared by the contacts table's
 * communication columns: the column's own icon, disabled, with the text
 * [WS-178](https://webitel.atlassian.net/browse/WS-178)
 */
import { ComponentSize, IconColor } from '@webitel/ui-sdk/enums';

defineProps<{
	icon: string;
	text: string;
}>();
</script>

<style scoped>
.communication-cell-empty {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

/**
 * Same box as the SM icon button in the filled phone cell (an SM icon with
 * --spacing-xs padding), so an empty row lines up with a filled one
 */
.communication-cell-empty__icon {
	display: flex;
	flex-shrink: 0;
	padding: var(--spacing-xs);
}
</style>
