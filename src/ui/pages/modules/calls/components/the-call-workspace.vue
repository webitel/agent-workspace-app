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
import { watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useCallsStore } from '../../../../../features/calls/store/calls';
import TheCallWindow from './the-call-window.vue';

const route = useRoute();
const router = useRouter();
const callsStore = useCallsStore();

// A Call window lives exactly as long as the SDK keeps its call: a stale URL,
// or the call's task released (form sent, deadline passed, none configured),
// leads back to the calls page. Returning to wherever the agent was before
// the call is the top panel story's (AC_13.01.13, WS-87).
watchEffect(() => {
	const callId = route.params.callId as string;
	if (callId && !callsStore.getCallById(callId)) router.replace('/calls');
});
</script>

<style scoped>
.the-call-workspace {
	display: flex;
	min-height: 0;
}
</style>
