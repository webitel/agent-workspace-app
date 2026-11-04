<template>
    <div class="task-dock-call-lane">
        <the-numpad-panel />

        <div class="task-dock-call-lane__container">
            <template
                v-for="windowedCall in windowedCalls"
                :key="windowedCall.id"
            >
                <active-call-tray-entry
                    v-if="windowedCall.isActive"
                    :preview="windowedCall.preview"
                    :expanded="taskDockStore.expandedCallId === windowedCall.id"
                    @update:expanded="taskDockStore.setCallExpanded(windowedCall.id, $event)"
                    @open-full-view="openCallWindow(windowedCall.id)"
                    @toggle-mute="callsStore.toggleMute(windowedCall.id)"
                    @toggle-hold="callsStore.toggleHold(windowedCall.id)"
                    @hangup="onHangup(windowedCall.id)"
                    @send-digit="callsStore.sendDtmf(windowedCall.id, $event)"
                />
                <post-processing-call-bar
                    v-else-if="windowedCall.task"
                    :preview="windowedCall.preview"
                    :task="windowedCall.task"
                    @open-full-view="openCallWindow(windowedCall.id)"
                />
            </template>
        </div>
    </div>
</template>

<script
    setup
    lang="ts"
>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { isActiveCall } from '../../../features/calls/scripts/isActiveCall';
import { toActiveCallContent } from '../../../features/calls/scripts/toActiveCallContent';
import { useCallsStore } from '../../../features/calls/store/calls';
import ActiveCallTrayEntry from '../../call/modules/call-dock/components/active-call-tray-entry.vue';
import PostProcessingCallBar from '../../call/modules/call-dock/components/post-processing-call-bar.vue';
import TheNumpadPanel from '../../numpad/components/the-numpad-panel.vue';
import { useTaskDockStore } from '../store/task-dock';

const taskDockStore = useTaskDockStore();
const router = useRouter();
const callsStore = useCallsStore();

// Every call with a Call window, so an agent who left one during post-processing
// has a way back to it (AC_13.02.04). An ended call is still listed only while
// its task is in post-processing.
const windowedCalls = computed(() =>
	callsStore.windowedCalls.map((call) => ({
		id: call.id,
		preview: toActiveCallContent(call),
		isActive: isActiveCall(call),
		task: call.task,
	})),
);

function onHangup(callId: string): void {
	taskDockStore.setCallExpanded(callId, false);
	callsStore.hangup(callId);
}

function openCallWindow(callId: string) {
	router.push({
		name: 'call-window',
		params: {
			callId,
		},
	});
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
