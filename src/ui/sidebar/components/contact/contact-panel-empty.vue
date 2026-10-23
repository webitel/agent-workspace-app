<template>
	<empty-state-block
		:image="emptyContact"
		:title="title"
		:text="text"
		width="88"
	>
		<template
			v-if="slots.actions"
			#actions
		>
			<slot name="actions" />
		</template>
	</empty-state-block>
</template>

<script setup lang="ts">
import emptyContact from '../../../../app/assets/ws-empty-contact.svg';
import EmptyStateBlock from '../../../components/empty-state-block/empty-state-block.vue';

defineProps<{
	title: string;
	text: string;
}>();

const slots = defineSlots<{
	actions?: () => unknown;
}>();
</script>
