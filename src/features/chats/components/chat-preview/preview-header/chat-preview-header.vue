<template>
    <header class="chat-preview-header">
        <wt-avatar
            :src="avatar"
            :username="name"
        />
        <div class="chat-preview-header__info">
            <h3 class="chat-preview-header__title">{{ name }}</h3>
            <p class="chat-preview-header__subtitle">{{ username }}</p>
        </div>
        <wt-chip v-show="unreadCount">
            {{ unreadCount }}</wt-chip>
    </header>
</template>

<script
    lang="ts"
    setup
>
import { WtAvatar, WtChip } from '@webitel/ui-sdk/components';

defineProps<{
	name: string;
	username: string;
	unreadCount: number;
	avatar: string;
}>();
</script>

<style scoped></style>