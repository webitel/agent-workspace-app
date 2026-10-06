<template>
    <button
        type="button"
        class="chat-unread-filter"
        :aria-pressed="chatListStore.onlyUnread"
        :title="t('ui.chatPreview.onlyUnread')"
        @click="chatListStore.toggleOnlyUnread()"
    >
        <wt-icon
            :icon="chatListStore.onlyUnread ? 'chat--filled' : 'chat'"
            :color="chatListStore.onlyUnread ? IconColor.ACTIVE : IconColor.DEFAULT"
        />
    </button>
</template>

<script setup lang="ts">
import { WtIcon } from '@webitel/ui-sdk/components';
import { IconColor } from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';

import { useChatListStore } from '../../store/chat-list';

const { t } = useI18n();
const chatListStore = useChatListStore();
</script>

<style scoped>
.chat-unread-filter {
    padding: 0;
    border: none;
    background: none;
    line-height: 0;
    cursor: pointer;
}
</style>
