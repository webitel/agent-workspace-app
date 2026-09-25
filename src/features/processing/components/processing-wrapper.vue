<template>
	<article class="processing-wrapper">
		<div class="processing-wrapper__content wt-scrollbar">
			<header
				v-if="$slots.title"
				class="processing-wrapper__header typo-heading-2"
			>
				<slot name="title" />
			</header>
			<slot name="form" />
		</div>
		<footer class="processing-wrapper__actions">
			<slot name="actions" />
		</footer>
	</article>
</template>

<script setup lang="ts"></script>

<style scoped>
.processing-wrapper {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	height: 100%;
}

.processing-wrapper__content {
	display: flex;
	flex-grow: 1;
	flex-direction: column;
	gap: var(--spacing-xs);
	padding-right: var(--spacing-xs);
	overflow-y: auto;
}

.processing-wrapper__header {
	text-align: center;
}

.processing-wrapper__actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: var(--spacing-xs);
	padding-top: var(--spacing-sm);
}
</style>
