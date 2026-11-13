<template>
    <div class="task-dock-call-lane">
        <the-numpad-panel />
        <transfer-popup v-if="callTransferPopupStore.isOpenTransferPopup" />
        <bridge-popup v-if="callBridgePopupStore.isOpenBridgePopup" />

        <div class="task-dock-call-lane__container">
            <template
                v-for="windowedCall in windowedCalls"
                :key="windowedCall.id"
            >
                <active-call-tray-entry
                    v-if="windowedCall.isActive"
                    :preview="windowedCall.preview"
                    :expanded="taskDockStore.expandedCallId === windowedCall.id"
                    :can-bridge="windowedCall.canBridge"
                    @update:expanded="taskDockStore.setCallExpanded(windowedCall.id, $event)"
                    @open-full-view="openCallWindow(windowedCall.id)"
                    @toggle-mute="callsStore.toggleMute(windowedCall.id)"
                    @toggle-hold="callsStore.toggleHold(windowedCall.id)"
                    @transfer="callTransferPopupStore.open(windowedCall.id)"
                    @bridge="callBridgePopupStore.open(windowedCall.id)"
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

        <div
            v-if="ringingConsultCards.length"
            class="task-dock-call-lane__consult-cards"
        >
            <outbound-call-card
                v-for="consultCall in ringingConsultCards"
                :key="consultCall.id"
                class="task-dock-call-lane__consult-card"
                :preview="consultCall.preview"
                :status="OutboundCallStatus.Ringing"
                :is-muted="consultCall.isMuted"
                :can-toggle-mute="true"
                @toggle-mute="callsStore.toggleMute(consultCall.id)"
                @hangup="callsStore.hangup(consultCall.id)"
            />
        </div>
    </div>
</template>

<script
    setup
    lang="ts"
>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { OutboundCallStatus } from '../../../features/calls/enums/OutboundCallStatus.enum';
import { isActiveCall } from '../../../features/calls/scripts/isActiveCall';
import { toActiveCallContent } from '../../../features/calls/scripts/toActiveCallContent';
import { toOutboundCallPreview } from '../../../features/calls/scripts/toOutboundCallPreview';
import { useCallsStore } from '../../../features/calls/store/calls';
import OutboundCallCard from '../../call/components/outbound-call-card.vue';
import BridgePopup from '../../call/modules/bridge/components/bridge-popup.vue';
import { useCallBridgePopupStore } from '../../call/modules/bridge/store/callBridgePopup';
import ActiveCallTrayEntry from '../../call/modules/call-dock/components/active-call-tray-entry.vue';
import PostProcessingCallBar from '../../call/modules/call-dock/components/post-processing-call-bar.vue';
import type { ActiveCallContent } from '../../call/modules/call-dock/types/ActiveCallContent.types';
import TransferPopup from '../../call/modules/transfer/components/transfer-popup.vue';
import { useCallTransferPopupStore } from '../../call/modules/transfer/store/callTransferPopup';
import TheNumpadPanel from '../../numpad/components/the-numpad-panel.vue';
import { CallsRouteName } from '../../pages/modules/calls/enums/CallsRouteName.enum';
import { useTaskDockStore } from '../store/task-dock';

const taskDockStore = useTaskDockStore();
const router = useRouter();
const callsStore = useCallsStore();
const callTransferPopupStore = useCallTransferPopupStore();
const callBridgePopupStore = useCallBridgePopupStore();

/**
 * @author Oleksandr Palonnyi
 * AC_14.02.07: bridging needs two calls to join, so the icon shows only while
 * the agent has more than one Active call
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
const hasMultipleActiveCalls = computed(
	() => callsStore.activeCalls.length > 1,
);

/**
 * @author Oleksandr Palonnyi
 * the icon is offered on the live call only: a Consult call bridged from the
 * held original did not hand the client over to the other agent, the call just
 * ended. Bridging from the live call is the one expected to work, still to
 * confirm on a live instance
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
const canBridgeFrom = (preview: ActiveCallContent): boolean =>
	hasMultipleActiveCalls.value && !preview.isHold;

// Every call with a Call window, so an agent who left one during post-processing
// has a way back to it (AC_13.02.04). An ended call is still listed only while
// its task is in post-processing.
const windowedCalls = computed(() =>
	callsStore.windowedCalls.map((call) => {
		const preview = toActiveCallContent(call);

		return {
			id: call.id,
			preview,
			isActive: isActiveCall(call),
			canBridge: canBridgeFrom(preview),
			task: call.task,
		};
	}),
);

/**
 * @author Oleksandr Palonnyi
 * a ringing Consult call is no Active call and has no outbound attempt (only
 * the numpad starts one), so nothing else shows it until the destination
 * answers. it reuses the outbound call card; No answer and retry are not
 * offered, the card goes when the call ends
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
const ringingConsultCards = computed(() =>
	callsStore.ringingConsultCalls.map((call) => ({
		id: call.id,
		preview: toOutboundCallPreview(call.displayNumber, call),
		isMuted: Boolean(call.muted),
	})),
);

function onHangup(callId: string): void {
	taskDockStore.setCallExpanded(callId, false);
	callsStore.hangup(callId);
}

function openCallWindow(callId: string) {
	router.push({
		name: CallsRouteName.CallWindow,
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

/**
 * @author Oleksandr Palonnyi
 * the outbound call card is 436px tall, taller than the dock strip, so in the
 * lane's flow it is not shown. it floats like the numpad panel's cards do, one
 * layer below them so an open numpad stays on top
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
.task-dock-call-lane__consult-cards {
    position: fixed;
    bottom: var(--spacing-xl);
    left: var(--spacing-xl);
    z-index: 100;
    display: flex;
    align-items: flex-end;
    gap: var(--wt-ws-dialer-sizes-root-gap);
}

.task-dock-call-lane__consult-card {
    box-shadow: var(--elevation-10);
}
</style>
