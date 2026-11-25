<template>
	<table-cell-info
		v-if="addresses.length"
		:icon="EMAIL_ICON"
		:icon-color="IconColor.MAIL"
		:items="addresses"
		item-label="email"
	/>

	<communication-cell-empty
		v-else
		:icon="EMAIL_ICON"
		:text="t('ui.pages.contacts.emails.noEmail')"
	/>
</template>

<script setup lang="ts">
import type { ContactsEmailAddress } from '@webitel/api-services/gen/models';
import { IconColor } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import TableCellInfo from '../../../../../components/table-cell-info.vue';
import CommunicationCellEmpty from './communication-cell-empty.vue';

const props = defineProps<{
	emails?: ContactsEmailAddress[];
}>();

const { t } = useI18n();

const EMAIL_ICON = 'ws-navigation-email';

/**
 * @author Polina Sukhorukova
 * An email record without an address cannot be written to, so it does not
 * count; a contact left with none shows "No email"
 * [WS-178](https://webitel.atlassian.net/browse/WS-178)
 */
const addresses = computed(() =>
	(props.emails ?? []).filter(({ email }) => Boolean(email)),
);
</script>
