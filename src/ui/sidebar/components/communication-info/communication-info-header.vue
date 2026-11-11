<template>
	<div
		:class="[
			'communication-info-header',
			`communication-info-header--${color}`,
		]"
	>
		<span class="communication-info-header__icon">
			<wt-icon
				:icon="icon"
				:color="color"
				:size="ComponentSize.SM"
			/>
		</span>
		<div class="communication-info-header__heading">
			<span class="communication-info-header__title typo-body-1-bold">
				{{ title }}
			</span>
			<span
				v-if="slots.subtitle"
				class="communication-info-header__subtitle typo-body-1"
			>
				<slot name="subtitle" />
			</span>
		</div>
		<div
			v-if="slots.aside"
			class="communication-info-header__aside"
		>
			<slot name="aside" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ComponentSize, type IconColor } from '@webitel/ui-sdk/enums';

defineProps<{
	icon: string;
	color: IconColor;
	title: string;
}>();

// What goes under the title and on the right is up to the communication:
// a call shows its start time and a timer, an email its message count.
const slots = defineSlots<{
	subtitle?: () => unknown;
	aside?: () => unknown;
}>();
</script>

<style scoped>
.communication-info-header {
	display: flex;
	align-items: flex-start;
	gap: var(--spacing-xs);
	padding-top: var(--spacing-xs);
	border-top: var(--spacing-2xs) solid transparent;
}

/* the color colors the bar on top and the box behind the icon */
.communication-info-header--success {
	border-top-color: var(--success-color);
}

.communication-info-header--success .communication-info-header__icon {
	background: var(--success-on-color);
}

.communication-info-header--info {
	border-top-color: var(--info-color);
}

.communication-info-header--info .communication-info-header__icon {
	background: var(--info-on-color);
}

.communication-info-header__icon {
	display: inline-flex;
	flex: none;
	padding: var(--spacing-xs);
	border-radius: var(--border-radius);
}

.communication-info-header__heading {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: var(--spacing-2xs);
	min-width: 0;
}

.communication-info-header__aside {
	flex: none;
}
</style>
