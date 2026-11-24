<template>
	<communication-cell-empty
		v-if="!hasChat"
		:icon="CHAT_ICON"
		:text="t('ui.pages.contacts.chats.noChat')"
	/>

	<table-cell-info
		v-else-if="namedChats.length"
		:icon="CHAT_ICON"
		:icon-color="IconColor.CHAT"
		:items="namedChats"
	/>

	<wt-icon
		v-else
		:icon="CHAT_ICON"
		:size="ComponentSize.SM"
		:color="IconColor.CHAT"
	/>
</template>

<script setup lang="ts">
import type { ContactsIMClient } from '@webitel/api-services/gen/models';
import { ComponentSize, IconColor } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import TableCellInfo from '../../../../../components/table-cell-info.vue';
import CommunicationCellEmpty from './communication-cell-empty.vue';

const props = defineProps<{
	imclients?: ContactsIMClient[];
}>();

const { t } = useI18n();

const CHAT_ICON = 'ws-chat';

/**
 * @author Polina Sukhorukova
 * Any IM client counts as a chat, named or not: an IM-stack contact has no
 * name to show, yet the contact can still be reached there
 * [WS-178](https://webitel.atlassian.net/browse/WS-178)
 */
const hasChat = computed(() => Boolean(props.imclients?.length));

/**
 * @author Polina Sukhorukova
 * Only named clients get a chip; a contact whose clients are all nameless
 * shows the chat icon alone, never a "-"
 * [WS-178](https://webitel.atlassian.net/browse/WS-178)
 */
const namedChats = computed(() =>
	(props.imclients ?? [])
		.map(({ id, user }) => ({
			id,
			name: user?.name,
		}))
		.filter(({ name }) => Boolean(name)),
);
</script>
