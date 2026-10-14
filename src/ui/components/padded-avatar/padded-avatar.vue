<template>
	<div
		class="padded-avatar"
		:class="`padded-avatar--${size}`"
	>
		<wt-avatar
			:size="size"
			:username="username"
			:src="src"
		/>
	</div>
</template>

<script setup lang="ts">
import { WtAvatar } from '@webitel/ui-sdk/components';

withDefaults(
	defineProps<{
		size: 'xs' | 'sm';
		username?: string;
		src?: string;
	}>(),
	{
		username: undefined,
		src: undefined,
	},
);
</script>

<style scoped>
.padded-avatar {
	display: inline-flex;
	flex-shrink: 0;
}

.padded-avatar--xs {
	padding: var(--spacing-2xs);
}

/**
 * @author Oleksandr Palonnyi
 * the design asks for 6px around the sm avatar and the spacing scale has no 6px step
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
.padded-avatar--sm {
	padding: calc(var(--spacing-2xs) * 1.5);
}
</style>
