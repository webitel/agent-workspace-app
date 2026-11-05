<template>
    <div
        ref="root"
        class="the-chat-previews-list"
    >
        <header class="the-chat-previews-list__toolbar">
            <chat-list-tabs />
            <chat-unread-filter v-if="chatActiveStore.isUnreadFilterAvailable" />
        </header>
        <chat-list-search class="the-chat-previews-list__search" />
        <ul>
            <li
                v-for="chat in chatListStore.currentTasks"
                :key="chat.id"
            >
                <chat-preview :task="(chat as Task)" />
                <wt-divider />
            </li>
            <!-- the next page is read as this comes into view (AC_02.01.02) -->
            <li
                v-if="chatListStore.hasNext"
                ref="sentinel"
                class="the-chat-previews-list__sentinel"
            >
                <wt-loader
                    v-if="chatListStore.isLoading"
                    size="sm"
                />
            </li>
        </ul>
    </div>
</template>

<script
    setup
    lang="ts"
>
import { useIntersectionObserver } from '@vueuse/core';
import { WtDivider, WtLoader } from '@webitel/ui-sdk/components';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { shallowRef, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { type Task } from 'webitel-sdk';
import ChatListSearch from '../../../../../features/chats/modules/previews/components/chat-list-search/chat-list-search.vue';
import ChatListTabs from '../../../../../features/chats/modules/previews/components/chat-list-tabs/chat-list-tabs.vue';
import ChatPreview from '../../../../../features/chats/modules/previews/components/chat-preview/chat-preview.vue';
import ChatUnreadFilter from '../../../../../features/chats/modules/previews/components/chat-unread-filter/chat-unread-filter.vue';
import { useChatActiveStore } from '../../../../../features/chats/modules/previews/store/chat-active';
import { useChatListStore } from '../../../../../features/chats/modules/previews/store/chat-list';

const chatListStore = useChatListStore();
const chatActiveStore = useChatActiveStore();
const { t } = useI18n();

const root = useTemplateRef<HTMLElement>('root');
const sentinel = useTemplateRef<HTMLElement>('sentinel');
const isSentinelVisible = shallowRef(false);

useIntersectionObserver(
	sentinel,
	([entry]) => {
		isSentinelVisible.value = Boolean(entry?.isIntersecting);
	},
	{
		root,
	},
);

// the end of the list came into view; a failed read is tried again this way
watch(isSentinelVisible, (isVisible) => {
	if (isVisible) void chatListStore.loadNext();
});

/**
 * Reads on while the end of the list stays in view: a page shorter than the
 * panel leaves it there, and the observer would not report it again. A failed
 * read waits for the agent to scroll away and back.
 */
watch(
	() => chatListStore.isLoading,
	(isLoading) => {
		if (!isLoading && isSentinelVisible.value && !chatListStore.loadError)
			void chatListStore.loadNext();
	},
);

watch(
	() => chatListStore.loadError,
	(error) => {
		if (!error) return;
		eventBus.$emit('notification', {
			type: 'error',
			text: t('ui.chatList.loadError'),
		});
	},
);
</script>

<style scoped>
.the-chat-previews-list {
    overflow-y: auto;
}

.the-chat-previews-list__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs);
}

.the-chat-previews-list__search {
    padding: 0 var(--spacing-xs);
}

.the-chat-previews-list__sentinel {
    display: flex;
    justify-content: center;
    min-height: var(--spacing-md);
    padding: var(--spacing-xs);
}
</style>
