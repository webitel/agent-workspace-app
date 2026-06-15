<template>
    <div class="task-dock-call-lane">
        <task-dock-item-wrapper
            label="Numpad"
            :expanded="true"
            :collapsible="false"
        >
            Numpad
        </task-dock-item-wrapper>

        <task-dock-item-wrapper
            v-for="call in calls"
            :key="call.id"
            :label="call.label"
            :expanded="taskDockStore.expandedCallId === call.id"
            @click="taskDockStore.toggleCallExpand(call.id)"
        >
            Call
        </task-dock-item-wrapper>
    </div>
</template>

<script
    setup
    lang="ts"
>
import { useTaskDockStore } from '../store/task-dock';
import TaskDockItemWrapper from './task-dock-item-wrapper.vue';

const taskDockStore = useTaskDockStore();

const calls = [
	{
		id: 'call-1',
		label: 'Call 1',
	},
	{
		id: 'call-2',
		label: 'Call 2',
	},
];
</script>

<style scoped>
.task-dock-call-lane {
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-start;
}
</style>
