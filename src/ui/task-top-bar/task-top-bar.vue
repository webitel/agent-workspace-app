<template>
	<header class="task-top-bar">
		<div class="task-top-bar__identity">
			<slot name="leading" />
			<wt-avatar
				:username="name"
				size="sm"
			/>
			<div class="task-top-bar__info">
				<span class="task-top-bar__name typo-body-2-bold">
					{{ name || t('ui.notifications.offer.unknownContact') }}
				</span>
				<span
					v-if="subtitle"
					class="task-top-bar__subtitle"
				>
					<span
						v-if="subtitleLabel"
						class="task-top-bar__subtitle-label typo-caption-bold"
					>
						{{ subtitleLabel }}:
					</span>
					<span class="task-top-bar__subtitle-value typo-caption">
						{{ subtitle }}
					</span>
				</span>
			</div>
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
	/** Names the subtitle, rendered as `Queue: …`; without it the value stands alone. */
	subtitleLabel?: string;
}>();

const { t } = useI18n();
</script>

<style scoped>
.task-top-bar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: var(--wt-ws-chat-page-sizes-top-bar-gap);
	padding: var(--wt-ws-chat-page-sizes-top-bar-padding-y)
		var(--wt-ws-chat-page-sizes-top-bar-padding-right)
		var(--wt-ws-chat-page-sizes-top-bar-padding-y)
		var(--wt-ws-chat-page-sizes-top-bar-padding-left);
	border-radius: var(--wt-ws-chat-page-sizes-top-bar-border-radius);
	background: var(--wt-ws-chat-page-colors-top-bar-background);
	overflow: clip;
}

/* wraps the timer and actions underneath once the queue would drop below its
   minimum width (the design's container-query frames) */
.task-top-bar__identity {
	display: flex;
	flex: 1 1 250px;
	align-items: center;
	gap: var(--wt-ws-chat-page-sizes-top-bar-gap);
	min-width: 0;
}

.task-top-bar__info {
	display: flex;
	flex: 1;
	flex-direction: column;
	justify-content: center;
	min-width: 0;
	color: var(--text-main-color);
}

.task-top-bar__name {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.task-top-bar__subtitle {
	display: flex;
	gap: var(--spacing-2xs);
	min-width: 150px;
	font-style: italic;
}

.task-top-bar__subtitle-label {
	white-space: nowrap;
}

.task-top-bar__subtitle-value {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.task-top-bar__trailing {
	display: flex;
	align-items: center;
	gap: var(--wt-ws-chat-page-sizes-top-bar-gap);
	margin-left: auto;
}
</style>
