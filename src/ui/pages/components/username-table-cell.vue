<template>
	<div class="username-table-cell">
		<wt-avatar
			size="sm"
			:username="name"
		/>

		<button
			v-if="clickable"
			type="button"
			class="username-table-cell__name username-table-cell__name--clickable"
			@click="emit('click')"
		>
			{{ name }}
		</button>
		<span
			v-else
			class="username-table-cell__name"
		>
			{{ name }}
		</span>
	</div>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		name?: string;
		clickable?: boolean;
	}>(),
	{
		name: '',
		clickable: false,
	},
);

const emit = defineEmits<{
	click: [];
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

.username-table-cell__name--clickable {
	text-align: start;
	cursor: pointer;
}
</style>
