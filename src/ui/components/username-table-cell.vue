<template>
	<div class="username-table-cell">
		<wt-avatar
			size="xs"
			:username="name"
		/>

		{{ name }}
	</div>
</template>

<script setup lang="ts">
defineProps<{
	name?: string;
}>();
</script>

<style scoped>
.username-table-cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}
</style>
