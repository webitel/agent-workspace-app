<template>
	<div
		:class="{
			'calls-history-name-cell--queue': isUnansweredQueueCall,
		}"
		class="calls-history-name-cell"
	>
		<wt-avatar
			:src="isUnansweredQueueCall ? queueAvatar : undefined"
			:username="displayName"
			size="sm"
		/>
		<wt-icon :icon="callIcon.icon" size="sm" :color="callIcon.color" />
		<p>{{ displayName }}</p>
	</div>
</template>

<script setup lang="ts">
import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { computed } from 'vue';
import { CallDirection } from 'webitel-sdk';
import queueAvatar from '../../../../../../app/assets/ws-queue-avatar.svg';
import { isUnansweredQueueCall as checkUnansweredQueueCall } from './scripts/isUnansweredQueueCall';

const props = defineProps<{
	item: EngineHistoryCall;
}>();

const displayName = computed(() => {
	const { contact, direction, to, from, destination } = props.item;

	if (direction === CallDirection.Outbound) {
		return to?.name || to?.number || destination;
	}

	return contact?.name || from?.name || from?.number;
});

const callIcon = computed(() => {
	if (props.item.direction === CallDirection.Outbound) {
		return {
			color: 'info',
			icon: 'ws-outbound-call',
		};
	}

	if (!props.item.answeredAt) {
		return {
			color: 'error',
			icon: 'ws-missed-call',
		};
	}

	return {
		color: 'success',
		icon: 'ws-inbound-call',
	};
});

const isUnansweredQueueCall = computed(() =>
	checkUnansweredQueueCall(props.item),
);
</script>

<style scoped>
.calls-history-name-cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.calls-history-name-cell .wt-avatar {
	flex-shrink: 0;
}

.calls-history-name-cell--queue p {
	color: var(--wt-ws-avatar-colors-unknown-user-color);
}
</style>
