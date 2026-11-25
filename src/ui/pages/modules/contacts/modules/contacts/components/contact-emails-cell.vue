<template>
	<communication-cell-list
		v-if="primaryEmail"
		:value="primaryEmail"
		:options="emailAddresses"
		:icon="EMAIL_ICON"
		:icon-color="IconColor.MAIL"
	>
		<template #more-tooltip="{ count }">
			{{ t('ui.pages.contacts.emails.moreEmails', { count }) }}
		</template>
	</communication-cell-list>

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
import CommunicationCellEmpty from './communication-cell-empty.vue';
import CommunicationCellList from './communication-cell-list.vue';

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

/**
 * @author Polina Sukhorukova
 * Shown like the phone column: the primary address, or the first one when
 * none is marked primary. A menu row has no action: writing an email from
 * the table (US_20.05) is described separately
 * [WS-177](https://webitel.atlassian.net/browse/WS-177)
 */
const primaryEmail = computed(
	() =>
		(addresses.value.find(({ primary }) => primary) ?? addresses.value[0])
			?.email ?? '',
);

const emailAddresses = computed(() =>
	addresses.value.map(({ email }) => email ?? ''),
);
</script>
