<template>
	<communication-cell-list
		v-if="primaryPhoneNumber"
		:value="primaryPhoneNumber"
		:options="phoneNumbers"
		icon="call--filled"
		:icon-color="IconColor.SUCCESS"
		:disabled="isCalling"
		@select="call"
	>
		<template #icon>
			<phone-call-button
				:number="primaryPhoneNumber"
				:disabled="isCalling"
				@click="call(primaryPhoneNumber)"
			/>
		</template>

		<template #more-tooltip="{ count }">
			{{ t('ui.pages.contacts.phones.moreNumbers', { count }) }}
		</template>
	</communication-cell-list>

	<communication-cell-empty
		v-else
		icon="call--filled"
		:text="t('ui.pages.contacts.phones.noPhone')"
	/>
</template>

<script setup lang="ts">
import type { ContactsPhoneNumber } from '@webitel/api-services/gen/models';
import { IconColor } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useOutboundCall } from '../../../../../../../features/calls/composables/useOutboundCall';
import PhoneCallButton from '../../../../../../components/phone-call-button/phone-call-button.vue';
import CommunicationCellEmpty from './communication-cell-empty.vue';
import CommunicationCellList from './communication-cell-list.vue';

const props = defineProps<{
	phones?: ContactsPhoneNumber[];
}>();

const { t } = useI18n();

const { isCalling, call } = useOutboundCall();

/**
 * @author Oleksandr Palonnyi
 * Entries without a number are dropped here, so every row below can be dialled
 * [WTEL-WS-27](https://webitel.atlassian.net/browse/WTEL-WS-27)
 */
const dialablePhones = computed(() =>
	(props.phones ?? []).filter(({ number }) => Boolean(number)),
);

/**
 * @author Oleksandr Palonnyi
 * The contact's primary number is shown in the column and dialled by the
 * button (AC_20.02.02); a contact with none marked primary falls back to its first
 * [WTEL-WS-27](https://webitel.atlassian.net/browse/WTEL-WS-27)
 */
const primaryPhoneNumber = computed(
	() =>
		(
			dialablePhones.value.find(({ primary }) => primary) ??
			dialablePhones.value[0]
		)?.number ?? '',
);

const phoneNumbers = computed(() =>
	dialablePhones.value.map(({ number }) => number ?? ''),
);
</script>
