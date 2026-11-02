<template>
    <wt-search-bar
        class="chat-list-search"
        :value="draft"
        full-width
        @input="draft = $event"
        @search="chatListStore.setQuery($event)"
    />
</template>

<script setup lang="ts">
import { WtSearchBar } from '@webitel/ui-sdk/components';
import { ref } from 'vue';

import { useChatListStore } from '../../store/chat-list';

const chatListStore = useChatListStore();

// what is typed; the list is searched when the search bar says typing paused
const draft = ref(chatListStore.query);
</script>
