<template>
	<task-top-bar
		class="call-top-bar"
		:name="preview.number"
		:subtitle="preview.queueName"
		:subtitle-label="t('ui.notifications.offer.queue')"
	>
		<template #leading>
			<wt-icon
				v-if="isOffered"
				color="info"
				icon="bell"
			/>
			<wt-icon
				v-else
				color="success"
				icon="ws-chat-clock"
			/>
		</template>

		<template #name-append>
			<wt-copy-action
				v-if="copyableNumber"
				:value="copyableNumber"
				color="info"
				size="sm"
			/>
		</template>

		<template #status>
			<post-processing-timer
				v-if="postProcessingTask"
				:task="postProcessingTask"
			/>
		</template>

		<template #actions>
			<call-top-bar-offer-actions
				v-if="isOffered"
				:pending="offersStore.pendingAction(call.id)"
				@accept="offersStore.accept(call.id)"
				@decline="offersStore.decline(call.id)"
			/>
			<call-top-bar-actions
				v-else-if="isConnected"
				:call="call"
			/>
		</template>
	</task-top-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Call } from 'webitel-sdk';
import { useOffersStore } from '../../../../ui/notifications/modules/offers/store/offers';
import TaskTopBar from '../../../../ui/task-top-bar/task-top-bar.vue';
import PostProcessingTimer from '../../../processing/components/post-processing-timer.vue';
import { useProcessingStore } from '../../../processing/store/processing';
import { isActiveCall } from '../../scripts/isActiveCall';
import { toActiveCallContent } from '../../scripts/toActiveCallContent';
import CallTopBarActions from './call-top-bar-actions.vue';
import CallTopBarOfferActions from './call-top-bar-offer-actions.vue';

const props = defineProps<{
	call: Call;
}>();

const { t } = useI18n();
const offersStore = useOffersStore();

// Same identity as the dock's pill, masking included. The bar shows the number
// alone (AC_13.01.01): the contact's name is the right panel's (US_13.06).
const preview = computed(() => toActiveCallContent(props.call));

// A hidden number is never put on the clipboard, masked or not: the mask is
// useless there and the real one is what `hideNumber` withholds.
const copyableNumber = computed(() =>
	props.call.hideNumber ? undefined : props.call.displayNumber || undefined,
);

/**
 * @author Oleksandr Palonnyi
 * a call is the offer being looked at before it is accepted (US_13.08) only while
 * the offers store holds it: an unanswered call without an offer, such as an outbound
 * attempt, has no Accept / Decline to act on. Both buttons go through the offers store
 * like the offer card's, so they share one in-flight lock
 * [WS-105](https://webitel.atlassian.net/browse/WS-105)
 */
const isOffered = computed(() => offersStore.hasOffer(props.call.id));

// The bar's other two states follow the call, not the task: a form can land mid-call
// without the call's actions going anywhere, and once hung up there is nothing
// left to mute, hold, transfer or end.
const isConnected = computed(() => isActiveCall(props.call));

const postProcessingTask = computed(() => {
	const { task } = props.call;
	if (isConnected.value || !task) return null;
	return useProcessingStore(task).isPostProcessing ? task : null;
});
</script>

<style scoped>
/* DES-711 sets the caller's number in italic, like the queue beneath it */
.call-top-bar :deep(.task-top-bar__name) {
	font-style: italic;
}
</style>
