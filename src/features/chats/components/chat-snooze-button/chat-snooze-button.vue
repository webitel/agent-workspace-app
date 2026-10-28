<template>
	<wt-button
		class="chat-snooze-button"
		color="secondary"
		size="sm"
		variant="outlined"
		@click="snooze"
	>
		{{ t('ui.chatList.snooze.action') }}
	</wt-button>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { useI18n } from 'vue-i18n';

import { useChatSnoozedStore } from '../../modules/previews/store/chat-snoozed';

const props = defineProps<{
	threadId: string;
}>();

const { t } = useI18n();
const snoozedStore = useChatSnoozedStore();

/**
 * Moves the chat to the Snoozed tab and leaves the agent on it (AC_03.02.03);
 * the button goes once the chat counts as snoozed.
 */
async function snooze() {
	try {
		await snoozedStore.snooze(props.threadId);
	} catch {
		eventBus.$emit('notification', {
			type: 'error',
			text: t('ui.chatList.snooze.error'),
		});
	}
}
</script>
