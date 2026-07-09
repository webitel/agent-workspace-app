<template>
    <div class="chat-preview">
        <router-link :to="`/chats/${threadId}`">
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
        </router-link>
    </div>
</template>

<script setup lang="ts">
import { type Task } from 'webitel-sdk';
import { computed } from 'vue';

import ChatPreviewHeader from './preview-header/chat-preview-header.vue';
import ChatPreviewBody from './preview-body/chat-preview-body.vue';
import ChatPreviewFooter from './preview-footer/chat-preview-footer.vue';

const props = defineProps<{
	task: Task;
}>();

const thread = computed(() => props.task.thread);
const threadId = computed(() => props.task.thread.id);
const avatar = computed(() => '');
const unreadCount = computed(() => 0);
</script>

<style scoped>
</style>