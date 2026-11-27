<template>
	<div class="communication-cell-empty">
		<communication-cell-icon
			:icon="icon"
			:color="IconColor.DISABLED"
		/>
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
import { IconColor } from '@webitel/ui-sdk/enums';
import CommunicationCellIcon from './communication-cell-icon.vue';

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
</style>
