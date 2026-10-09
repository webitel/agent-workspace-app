<template>
    <div class="task-dock-call-lane">
        <the-dialer-panel />

        <active-call-bar
            v-for="activeCall in activeCalls"
            :key="activeCall.id"
            :preview="activeCall.preview"
            :expanded="taskDockStore.expandedCallId === activeCall.id"
            @toggle-expand="taskDockStore.toggleCallExpand(activeCall.id)"
            @collapse="onCollapse(activeCall.id)"
            @toggle-mute="callsStore.toggleMute(activeCall.id)"
            @toggle-hold="callsStore.toggleHold(activeCall.id)"
            @hangup="callsStore.hangup(activeCall.id)"
            @send-digit="callsStore.sendDtmf(activeCall.id, $event)"
        />
    </div>
</template>

<script
    setup
    lang="ts"
>
import { computed } from 'vue';

import { toActiveCallPreview } from '../../../features/calls/scripts/toActiveCallPreview';
import { useCallsStore } from '../../../features/calls/store/calls';
import ActiveCallBar from '../../dialer/components/active-call-bar.vue';
import TheDialerPanel from '../../dialer/components/the-dialer-panel.vue';
import { useTaskDockStore } from '../store/task-dock';

const taskDockStore = useTaskDockStore();
const callsStore = useCallsStore();

const activeCalls = computed(() =>
	callsStore.activeCalls.map((call) => ({
		id: call.id,
		preview: toActiveCallPreview(call),
	})),
);

function onCollapse(callId: string) {
	if (taskDockStore.expandedCallId === callId) {
		taskDockStore.toggleCallExpand(callId);
	}
}
</script>

<style scoped>
.task-dock-call-lane {
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-start;
}
</style>
