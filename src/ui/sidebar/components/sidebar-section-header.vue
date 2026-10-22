<template>
	<div class="sidebar-section-header">
		<div class="sidebar-section-header__icon">
			<wt-icon :icon="icon" :color="iconColor" size="sm" />
		</div>
		<h2 class="sidebar-section-header__title typo-body-1-bold">
			{{ title }}
		</h2>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	icon: string;
	iconColor: string;
	title: string;
}>();
</script>

<style scoped>
.sidebar-section-header {
	display: flex;
	align-items: center;
	gap: var(--wt-ws-widgets-sizes-row-gap);
	width: 100%;
}

/*над стилями я ще подумаю*/
.sidebar-section-header__icon {
	display: flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	border-radius: var(--wt-ws-widgets-sizes-icon-box-border-radius);
	background: #EAF1FB;
	padding: var(--wt-ws-chat-page-sizes-top-bar-padding-y)
		var(--wt-ws-chat-page-sizes-top-bar-padding-right)
		var(--wt-ws-chat-page-sizes-top-bar-padding-y)
		var(--wt-ws-chat-page-sizes-top-bar-padding-left);
}

.sidebar-section-header__title {
	margin: 0;
}
</style>
