<template>
    <div class="task-dock-call-lane">
        <the-numpad-panel />

        <div class="task-dock-call-lane__container">
            <floating-call-widget
                v-for="activeCall in activeCalls"
                :key="activeCall.id"
                :preview="activeCall.preview"
                :expanded="taskDockStore.expandedCallId === activeCall.id"
                @toggle-expand="taskDockStore.toggleCallExpand(activeCall.id)"
                @collapse="onCollapse(activeCall.id)"
                @toggle-mute="callsStore.toggleMute(activeCall.id)"
                @toggle-hold="callsStore.toggleHold(activeCall.id)"
                @hangup="onHangup(activeCall.id)"
                @send-digit="callsStore.sendDtmf(activeCall.id, $event)"
            />
        </div>
    </div>
</template>

<script
    setup
    lang="ts"
>
import { computed } from 'vue';

import { toActiveCallPreview } from '../../../features/calls/scripts/toActiveCallPreview';
import { useCallsStore } from '../../../features/calls/store/calls';
import FloatingCallWidget from '../../call/components/floating-call-widget.vue';
import TheNumpadPanel from '../../numpad/components/the-numpad-panel.vue';
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

function onHangup(callId: string) {
	onCollapse(callId);
	callsStore.hangup(callId);
}
</script>

<style scoped>
.task-dock-call-lane {
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-start;
}

.task-dock-call-lane__container {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: var(--spacing-xs);
}
</style>
