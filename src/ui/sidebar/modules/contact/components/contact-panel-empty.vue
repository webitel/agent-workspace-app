<template>
	<section class="contact-panel-empty">
		<wt-image
			:src="emptyContact"
			width="var(--icon-7xl-size)"
			alt=""
		/>
		<div class="contact-panel-empty__info">
			<h3 class="contact-panel-empty__title typo-heading-4">
				{{ title }}
			</h3>
			<p class="contact-panel-empty__text typo-body-1">
				{{ text }}
			</p>
		</div>
		<div
			v-if="slots.actions"
			class="contact-panel-empty__actions"
		>
			<slot name="actions" />
		</div>
	</section>
</template>

<script setup lang="ts">
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
.contact-panel-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--spacing-xs);
	text-align: center;
}

.contact-panel-empty__info {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.contact-panel-empty__title,
.contact-panel-empty__text {
	margin: 0;
}

.contact-panel-empty__actions {
	display: flex;
	gap: var(--spacing-xs);
}
</style>

