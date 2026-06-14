<template>
    <div class="task-dock-chat-lane">
        <task-dock-item-wrapper
            v-for="chat in chats"
            :key="chat.id"
            :label="chat.label"
            :expanded="taskDockStore.expandedChatId === chat.id"
            @click="taskDockStore.toggleChatExpand(chat.id)"
        >
            Chat
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

const chats = [
	{
		id: 'chat-1',
		label: 'Chat 1',
	},
	{
		id: 'chat-2',
		label: 'Chat 2',
	},
	{
		id: 'chat-3',
		label: 'Chat 3',
	},
];
</script>

<style scoped>
.task-dock-chat-lane {
    display: flex;
    flex: 1;
    flex-direction: row;
    align-items: flex-end;
    min-width: 0;
    overflow-x: auto;
}
</style>
