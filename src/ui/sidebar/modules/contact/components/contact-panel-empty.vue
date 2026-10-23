<template>
	<wt-empty
		class="contact-panel-empty"
		:image="emptyContact"
		:title="title"
		:text="text"
		:size="ComponentSize.SM"
	>
		<template
			v-if="slots.actions"
			#actions
		>
			<slot name="actions" />
		</template>
	</wt-empty>
</template>
<script setup lang="ts">
import { ComponentSize } from '@webitel/ui-sdk/enums';
import emptyContact from '../../../../../app/assets/ws-empty-contact.svg';

defineProps<{
	title: string;
	text: string;
}>();

const slots = defineSlots<{
	actions?: () => unknown;
}>();
</script>

<style scoped>
.wt-empty.contact-panel-empty {
	--wt-empty-width: 100%;
	--wt-empty-min-width: 0;
	--wt-empty-max-width: 100%;
	padding: 0;
	gap: var(--spacing-xs);
}
</style>
