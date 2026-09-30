<template>
	<header class="task-top-bar">
		<slot name="leading" />
		<wt-avatar
			:username="name"
			size="sm"
		/>
		<div class="task-top-bar__info">
			<span class="task-top-bar__name typo-body-1-bold">
				{{ name || t('ui.notifications.offer.unknownContact') }}
			</span>
			<span
				v-if="subtitle"
				class="task-top-bar__subtitle typo-body-2"
			>
				{{ subtitle }}
			</span>
		</div>

		<div class="task-top-bar__trailing">
			<slot name="status" />
			<slot name="actions" />
		</div>
	</header>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

/**
 * The header row of a task's window, a call or a chat: who it is with, a
 * status area (a timer) and an actions area. Channel-neutral, like the offer card — chats
 * and calls fill it from their own objects and bring their own timer and
 * actions through the slots, so nothing here knows about either SDK.
 */
defineProps<{
	/** Absent renders "Unknown contact" beside an N/A avatar. */
	name?: string;
	/** A username, a masked number, a queue — whatever the channel leads with. */
	subtitle?: string;
}>();

const { t } = useI18n();
</script>

<style scoped>
.task-top-bar {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	padding-bottom: var(--spacing-xs);
}

.task-top-bar__info {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.task-top-bar__name,
.task-top-bar__subtitle {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.task-top-bar__subtitle {
	color: var(--text-secondary-color);
}

.task-top-bar__trailing {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	margin-left: auto;
}
</style>
