<template>
    <div class="task-dock-call-lane">
        <the-numpad-panel />

        <div class="task-dock-call-lane__container">
            <floating-call-widget
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

import { toActiveCallContent } from '../../../features/calls/scripts/toActiveCallContent';
import { useCallsStore } from '../../../features/calls/store/calls';
import FloatingCallWidget from '../../call/modules/call-dock/components/floating-call-widget.vue';
import TheNumpadPanel from '../../numpad/components/the-numpad-panel.vue';

const callsStore = useCallsStore();

const activeCalls = computed(() =>
	callsStore.activeCalls.map((call) => ({
		id: call.id,
		preview: toActiveCallContent(call),
	})),
);
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
