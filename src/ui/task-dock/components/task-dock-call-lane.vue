<template>
    <div class="task-dock-call-lane">
        <the-dialer-panel />

        <div class="task-dock-call-lane__container">
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

/**
 * @author Oleksandr Palonnyi
 * TEMPORARY hardcoded calls for visual comparison with the design; remove
 * before merge. their actions do nothing because no SDK call backs them
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
const MOCK_ACTIVE_CALLS = [
	{
		id: 'mock-active-call',
		preview: {
			name: 'John Smith',
			number: '+380671234678',
			queueName: 'Support',
			answeredAt: Date.now() - 65_000,
			isHold: false,
			isMuted: false,
		},
	},
	{
		id: 'mock-hold-call',
		preview: {
			name: 'Emily Johnson',
			number: '+12023417842',
			queueName: 'Sales',
			answeredAt: Date.now() - 300_000,
			isHold: true,
			isMuted: true,
		},
	},
];

const activeCalls = computed(() => [
	...callsStore.activeCalls.map((call) => ({
		id: call.id,
		preview: toActiveCallPreview(call),
	})),
	...MOCK_ACTIVE_CALLS,
]);

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

.task-dock-call-lane__container {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: var(--spacing-xs);
}
</style>
