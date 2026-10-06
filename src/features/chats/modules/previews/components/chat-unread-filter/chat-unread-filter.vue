<template>
    <wt-icon-btn
        class="chat-unread-filter"
        :icon="chatListStore.onlyUnread ? 'chat--filled' : 'chat'"
        :color="chatListStore.onlyUnread ? IconColor.ACTIVE : IconColor.DEFAULT"
        :aria-pressed="chatListStore.onlyUnread"
        :title="t('ui.chatPreview.onlyUnread')"
        @click="chatListStore.toggleOnlyUnread()"
    />
</template>

<script setup lang="ts">
import { WtIconBtn } from '@webitel/ui-sdk/components';
import { IconColor } from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';

import { useChatListStore } from '../../store/chat-list';

const { t } = useI18n();
const chatListStore = useChatListStore();
</script>
