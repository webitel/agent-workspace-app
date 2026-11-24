<template>
	<wt-button
		class="contact-card-phone-call-button"
		icon="call--filled"
		:size="ComponentSize.SM"
		:color="ButtonColor.SUCCESS"
		:icon-color="IconColor.SUCCESS"
		:variant="ButtonVariant.TEXT"
		:disabled="isCalling"
		:aria-label="t('ui.pages.contacts.phones.call', { number })"
		width-by-content
		@click="startCall"
	/>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
import {
	ButtonColor,
	ButtonVariant,
	ComponentSize,
	IconColor,
} from '@webitel/ui-sdk/enums';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useOutboundCallAttemptsStore } from '../../../../features/calls/store/outboundCallAttempts';

const props = defineProps<{
	number: string;
}>();

const { t } = useI18n();

/**
 * Dials through an outbound attempt, as the Phones column of the Contacts table
 * does, so the agent gets the outbound call card (AC_07.07.05)
 * [WS-170](https://webitel.atlassian.net/browse/WS-170)
 */
const outboundCallAttemptsStore = useOutboundCallAttemptsStore();

const isCalling = ref(false);

async function startCall() {
	isCalling.value = true;
	try {
		await outboundCallAttemptsStore.start(props.number);
	} finally {
		isCalling.value = false;
	}
}
</script>

<style scoped>
.contact-card-phone-call-button {
	flex-shrink: 0;
}
</style>
