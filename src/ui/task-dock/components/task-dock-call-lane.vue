<template>
    <div class="task-dock-call-lane">
        <the-numpad-panel />

        <div class="task-dock-call-lane__container">
            <active-call-bar
                v-for="activeCall in activeCalls"
                :key="activeCall.id"
                :preview="activeCall.preview"
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
import ActiveCallBar from '../../call/components/active-call-bar.vue';
import TheNumpadPanel from '../../numpad/components/the-numpad-panel.vue';

const callsStore = useCallsStore();

/**
 * @author Oleksandr Palonnyi
 * temporary hardcoded call so the bar is visible without a real call, remove
 * together with the concat in `activeCalls`
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
const MOCK_ACTIVE_CALL = {
	id: 'mock-active-call',
	preview: {
		name: 'John Doe',
		number: '+380501234567',
		queueName: 'Support',
		answeredAt: Date.now(),
		isHold: false,
	},
};

const activeCalls = computed(() => [
	...callsStore.activeCalls.map((call) => ({
		id: call.id,
		preview: toActiveCallPreview(call),
	})),
	MOCK_ACTIVE_CALL,
]);
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
