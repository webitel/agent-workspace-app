<template>
    <div class="chat-preview">
        <button
            type="button"
            class="chat-preview__open"
            @click="chatsStore.openChat(threadId)"
        >
            <chat-preview-header
                :name="thread.subject ?? ''"
                :username="thread.subject ?? ''"
                :unread-count="unreadCount"
                :avatar="avatar"
            />
            <chat-preview-body
                :last-msg="thread.lastMsg"
            />
            <chat-preview-footer
                :queue="task.queue"
            />
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type Task } from 'webitel-sdk';

import { useChatsStore } from '../../store/chats';
import ChatPreviewBody from './preview-body/chat-preview-body.vue';
import ChatPreviewFooter from './preview-footer/chat-preview-footer.vue';
import ChatPreviewHeader from './preview-header/chat-preview-header.vue';

const props = defineProps<{
	task: Task;
}>();

const chatsStore = useChatsStore();

const thread = computed(() => props.task.thread);
const threadId = computed(() => props.task.thread.id);
const avatar = computed(() => '');
const unreadCount = computed(() => 0);
</script>

<style scoped>
.chat-preview {
    padding: var(--spacing-xs);
}

.chat-preview__open {
    display: block;
    width: 100%;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
    text-align: inherit;
    cursor: pointer;
}
</style>