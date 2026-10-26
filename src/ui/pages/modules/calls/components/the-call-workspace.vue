<template>
	<wt-layout class="the-call-workspace">
		<the-call-window />
	</wt-layout>
</template>

<script
	setup
	lang="ts"
>
import { WtLayout } from '@webitel/ui-sdk/components';
import { watch } from 'vue';
import {
	onBeforeRouteLeave,
	onBeforeRouteUpdate,
	useRoute,
	useRouter,
} from 'vue-router';

import { useCallsStore } from '../../../../../features/calls/store/calls';
import TheCallWindow from './the-call-window.vue';

const route = useRoute();
const router = useRouter();
const callsStore = useCallsStore();

// A Call window lives exactly as long as the SDK keeps its call. When it
// closes under the agent — the call's task released (form sent, deadline
// passed, none configured), or a call with no task hung up — they go back to
// its Return target, where they were when they accepted it (AC_13.01.13).
// Arriving at a call already gone is a stale link, not a window closing, so it
// leads to the calls page and follows no target: that is also what keeps a
// Return target that was itself a since-closed window from being chained.
watch(
	() => {
		const callId = route.params.callId as string;
		return [
			callId,
			Boolean(callId && callsStore.getCallById(callId)),
		] as const;
	},
	([callId, isKept], previous) => {
		if (!callId || isKept) return;

		const [previousCallId, wasKept] = previous ?? [];
		const hasClosed = previousCallId === callId && wasKept;
		router.replace(
			(hasClosed && callsStore.takeReturnTarget(callId)) || '/calls',
		);
	},
	{
		immediate: true,
	},
);

/**
 * @author Oleksandr Palonnyi
 * the window of an offer the agent opened to look at is left by navigating away
 * or on to another call; the target taken for that visit goes with it
 * [WS-105](https://webitel.atlassian.net/browse/WS-105)
 */
function forgetReturnTargetOfThisVisit() {
	callsStore.forgetReturnTargetOfUnansweredCall(route.params.callId as string);
}

onBeforeRouteUpdate(forgetReturnTargetOfThisVisit);
onBeforeRouteLeave(forgetReturnTargetOfThisVisit);
</script>

<style scoped>
.the-call-workspace {
	display: flex;
	min-height: 0;
}
</style>
