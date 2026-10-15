<template>
	<transition name="slide-up-overlay">
		<div
			v-if="isOpen"
			class="slide-up-overlay"
		>
			<slot />
		</div>
	</transition>
</template>

<script
	setup
	lang="ts"
>
defineProps<{
	isOpen: boolean;
}>();
</script>

<style scoped>
.slide-up-overlay {
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 1;
}

.slide-up-overlay-enter-active,
.slide-up-overlay-leave-active {
	transition: transform var(--transition) ease;
}

.slide-up-overlay-enter-from,
.slide-up-overlay-leave-to {
	transform: translateY(100%);
}
</style>
