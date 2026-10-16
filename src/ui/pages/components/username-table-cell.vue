<template>
	<div class="username-table-cell">
		<wt-avatar
			size="sm"
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

.wt-avatar {
	flex-shrink: 0;
}
</style>
