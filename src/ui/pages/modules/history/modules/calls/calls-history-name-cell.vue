<template>
	<div
		:class="{
			'calls-history-name-cell--queue': isUnansweredQueueCall,
		}"
		class="calls-history-name-cell"
	>
		<wt-avatar
			:src="avatarSrc"
			:username="name"
			size="sm"
		/>
		<wt-icon :icon="callIcon.icon" size="sm" :color="callIcon.color" />
		<p>{{ displayName }}</p>
	</div>
</template>

<script setup lang="ts">
import type {
	EngineEndpoint,
	EngineHistoryCall,
} from '@webitel/api-services/gen/models';
import { computed } from 'vue';
import { CallDirection } from 'webitel-sdk';
import queueAvatar from '../../../../../../app/assets/ws-queue-avatar.svg';
import unknownContactAvatar from '../../../../../../app/assets/ws-unknown-contact-avatar.svg';
import { getCallPhoneNumber } from './scripts/getCallPhoneNumber';
import { isUnansweredQueueCall as checkUnansweredQueueCall } from './scripts/isUnansweredQueueCall';

const props = defineProps<{
	item: EngineHistoryCall;
}>();

// backend fills `name` with the number itself when there is no member/schema name
const getCounterpartName = ({ name, number }: EngineEndpoint = {}) =>
	name !== number ? name : undefined;

const name = computed(() => {
	const { contact, direction, to, from } = props.item;
	const counterpart = direction === CallDirection.Outbound ? to : from;

	return contact?.name || getCounterpartName(counterpart);
});

const displayName = computed(
	() => name.value || getCallPhoneNumber(props.item),
);

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

const avatarSrc = computed(() => {
	if (isUnansweredQueueCall.value) return queueAvatar;
	if (!name.value) return unknownContactAvatar;
	return undefined;
});
</script>

<style scoped>
.calls-history-name-cell {
	display: flex;
	flex-grow: 1;
	align-items: center;
	gap: var(--spacing-xs);
	width: 0;
}

.calls-history-name-cell p {
	flex-grow: 1;
	width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.calls-history-name-cell .wt-avatar {
	flex-shrink: 0;
}

.calls-history-name-cell--queue p {
	color: var(--wt-ws-avatar-colors-unknown-user-color);
}
</style>
