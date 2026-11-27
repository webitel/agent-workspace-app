<template>
	<communication-cell-list
		v-if="hasChat"
		:value="chatNames[0]"
		:options="chatNames"
		:icon="CHAT_ICON"
		:icon-color="IconColor.CHAT"
	>
		<template #more-tooltip="{ count }">
			{{ t('ui.pages.contacts.chats.moreChats', { count }) }}
		</template>
	</communication-cell-list>

	<communication-cell-empty
		v-else
		:icon="CHAT_ICON"
		:text="t('ui.pages.contacts.chats.noChat')"
	/>
</template>

<script setup lang="ts">
import type { ContactsIMClient } from '@webitel/api-services/gen/models';
import { IconColor } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CommunicationCellEmpty from './communication-cell-empty.vue';
import CommunicationCellList from './communication-cell-list.vue';

const props = defineProps<{
	contactClients?: ContactsIMClient[];
}>();

const { t } = useI18n();

const CHAT_ICON = 'ws-chat';

/**
 * @author Polina Sukhorukova
 * Any IM client counts as a chat, named or not: an IM-stack contact has no
 * name to show, yet the contact can still be reached there
 * [WS-178](https://webitel.atlassian.net/browse/WS-178)
 */
const hasChat = computed(() => Boolean(props.contactClients?.length));

/**
 * @author Polina Sukhorukova
 * Only named clients are shown and counted, the first one in the column: an
 * IM client has no primary flag, and the chat select defaults to the first
 * (US_20.04). A contact whose clients are all nameless shows the chat icon
 * alone. A menu row has no action: sending a message from the table is not MVP
 * [WS-177](https://webitel.atlassian.net/browse/WS-177)
 */
const chatNames = computed(() =>
	(props.contactClients ?? [])
		.map(({ user }) => user?.name ?? '')
		.filter(Boolean),
);
</script>
