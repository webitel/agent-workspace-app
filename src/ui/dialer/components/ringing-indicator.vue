<template>
	<img
		class="ringing-indicator"
		:src="ringingAnimation"
		alt=""
		aria-hidden="true"
	/>
</template>

<script
	setup
	lang="ts"
>
import ringingAnimation from '../../../app/assets/wt-ringing-animation.svg';
</script>

<style scoped>
.ringing-indicator {
	display: block;
	width: 120px;
	height: 120px;
}
</style>
