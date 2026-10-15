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
import ActiveCallBar from '../../dialer/components/active-call-bar.vue';
import type { ActiveCallPreview } from '../../dialer/types/ActiveCallPreview.types';
import TheNumpadPanel from '../../numpad/components/the-numpad-panel.vue';

const callsStore = useCallsStore();

/**
 * @author Oleksandr Palonnyi
 * temporary hardcode for visual checks: shows one pill while there is no real
 * active call, remove it together with the fallback in `activeCalls` below
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
const STUB_ACTIVE_CALL = {
	id: 'stub-active-call',
	preview: {
		name: 'Emily Johnson',
		number: '+12023417842',
		queueName: 'Sales',
		answeredAt: Date.now(),
		isHold: false,
		isMuted: false,
	} satisfies ActiveCallPreview,
};

const activeCalls = computed(() => {
	const realActiveCalls = callsStore.activeCalls.map((call) => ({
		id: call.id,
		preview: toActiveCallPreview(call),
	}));

	return realActiveCalls.length
		? realActiveCalls
		: [
				STUB_ACTIVE_CALL,
			];
});
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
