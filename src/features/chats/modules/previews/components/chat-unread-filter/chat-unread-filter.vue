<template>
    <wt-icon-btn
        class="chat-unread-filter"
        :icon="chatActiveStore.onlyUnread ? 'chat--filled' : 'chat'"
        :color="chatActiveStore.onlyUnread ? IconColor.ACTIVE : IconColor.DEFAULT"
        :aria-pressed="chatActiveStore.onlyUnread"
        :title="t('ui.chatPreview.onlyUnread')"
        @click="chatListStore.toggleOnlyUnread()"
    />
</template>

<script setup lang="ts">
import { WtIconBtn } from '@webitel/ui-sdk/components';
import { IconColor } from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';

import { useChatActiveStore } from '../../store/chat-active';
import { useChatListStore } from '../../store/chat-list';

const { t } = useI18n();
// the state is the Active tab's; the toggle goes through the list, since on the
// Snoozed tab it also hands the agent over to Active
const chatActiveStore = useChatActiveStore();
const chatListStore = useChatListStore();
</script>
