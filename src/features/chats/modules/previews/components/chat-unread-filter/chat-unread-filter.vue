<template>
    <wt-icon-btn
        class="chat-unread-filter"
        :icon="chatActiveStore.onlyUnread ? 'chat--filled' : 'chat'"
        :color="chatActiveStore.onlyUnread ? IconColor.ACTIVE : IconColor.DEFAULT"
        :aria-pressed="chatActiveStore.onlyUnread"
        :title="t('ui.chatPreview.onlyUnread')"
        @click="chatActiveStore.toggleOnlyUnread()"
    />
</template>

<script setup lang="ts">
import { WtIconBtn } from '@webitel/ui-sdk/components';
import { IconColor } from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';

import { useChatActiveStore } from '../../store/chat-active';

const { t } = useI18n();
const chatActiveStore = useChatActiveStore();
</script>
