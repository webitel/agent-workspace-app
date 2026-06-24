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
import { computed } from 'vue';
import type { TaskPreview } from '../../types/ChatPreview.types';
import ChatPreviewHeader from './header/chat-preview-header.vue';

const props = defineProps<{
	task: TaskPreview;
}>();

const thread = computed(() => props.task.distribute.communication.thread);
const threadId = computed(() => props.task.distribute.member_channel_id);
const avatar = computed(() => '');
const unreadCount = computed(() => 0);
</script>

<style scoped>
</style>