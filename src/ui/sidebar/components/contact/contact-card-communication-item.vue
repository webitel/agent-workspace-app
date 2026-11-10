<template>
	<li class="contact-card-communication-item">
		<wt-icon
			v-if="item.icon"
			:icon="item.icon"
			:size="ComponentSize.SM"
		/>
		<span class="contact-card-communication-item__value typo-body-1-bold">
			{{ item.value }}
		</span>
		<!-- call / send message actions land here (AC_07.07.05, 07.06) -->
		<slot name="actions" />
	</li>
</template>

<script setup lang="ts">
import { ComponentSize } from '@webitel/ui-sdk/enums';
import type { ContactCommunicationItem } from './scripts/toContactCommunication';

defineProps<{
	item: ContactCommunicationItem;
}>();
</script>

<style scoped>
.contact-card-communication-item {
	display: flex;
	gap: var(--spacing-xs);
	align-items: center;
	min-width: 0;
}

.contact-card-communication-item__value {
	flex: 1;
	min-width: 0;
	word-break: break-word;
}
</style>
