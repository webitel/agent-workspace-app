<template>
	<section class="empty-state-block">
		<wt-image
			:src="image"
			:size="size"
			:width="width"
			:height="height"
			alt=""
		/>
		<div class="empty-state-block__info">
			<h3 class="empty-state-block__title typo-heading-4">
				{{ title }}
			</h3>
			<p class="empty-state-block__text typo-body-1">
				{{ text }}
			</p>
		</div>
		<div
			v-if="slots.actions"
			class="empty-state-block__actions"
		>
			<slot name="actions" />
		</div>
	</section>
</template>

<script setup lang="ts">
defineProps<{
	image: string;
	title?: string;
	text?: string;
	size?: string;
	width?: string;
	height?: string;
}>();

const slots = defineSlots<{
	actions?: () => unknown;
}>();
</script>

<style scoped>
.empty-state-block {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--spacing-xs);
	text-align: center;
}

.empty-state-block__info {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.empty-state-block__title,
.empty-state-block__text {
	margin: 0;
}

.empty-state-block__actions {
	display: flex;
	gap: var(--spacing-xs);
}
</style>
