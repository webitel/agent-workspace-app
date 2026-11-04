<template>
	<div class="sidebar-section-header">
		<h2 class="sidebar-section-header__title typo-body-1-bold">
			{{ title }}
		</h2>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	title: string;
}>();
</script>
