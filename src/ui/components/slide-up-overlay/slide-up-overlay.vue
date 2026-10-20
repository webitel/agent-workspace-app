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
/**
 * @author Oleksandr Palonnyi
 * the overlay is pinned to the bottom-left corner of the nearest positioned
 * ancestor, so the parent must be `position: relative` and is the element the
 * panel slides up from
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
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
