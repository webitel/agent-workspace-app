<template>
	<div class="contact-phones-cell">
		<template v-if="primaryPhoneNumber">
			<phone-call-button
				:number="primaryPhoneNumber"
				:disabled="isCalling"
				@click="call(primaryPhoneNumber)"
			/>
			<span class="contact-phones-cell__number">{{ primaryPhoneNumber }}</span>

			<wt-context-menu
				v-if="hasOtherPhones"
				:options="phoneOptions"
				:disabled="isCalling"
				@click="onPhoneOptionClick"
			>
				<template #activator="{ toggle }">
					<wt-tooltip>
						<template #activator>
							<wt-chip
								class="contact-phones-cell__more"
                :color="ChipColor.SECONDARY"
								@click="toggle"
							>
								+{{ otherPhonesCount }}
							</wt-chip>
						</template>
						{{ t('ui.pages.contacts.phones.moreNumbers', { count: otherPhonesCount }) }}
					</wt-tooltip>
				</template>

				<template #option="{ number }">
					<span class="contact-phones-cell__option">
						<wt-icon
							icon="call--filled"
							:size="ComponentSize.SM"
							:color="IconColor.SUCCESS"
						/>
						{{ number }}
					</span>
				</template>
			</wt-context-menu>
		</template>

		<communication-cell-empty
			v-else
			icon="call--filled"
			:text="t('ui.pages.contacts.phones.noPhone')"
		/>
	</div>
</template>

<script setup lang="ts">
import type { ContactsPhoneNumber } from '@webitel/api-services/gen/models';
import {
	WtChip,
	WtContextMenu,
	WtIcon,
	WtTooltip,
} from '@webitel/ui-sdk/components';
import { ChipColor, ComponentSize, IconColor } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useOutboundCall } from '../../../../../../../features/calls/composables/useOutboundCall';
import PhoneCallButton from '../../../../../../components/phone-call-button/phone-call-button.vue';
import CommunicationCellEmpty from './communication-cell-empty.vue';

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

const otherPhonesCount = computed(() => dialablePhones.value.length - 1);

const hasOtherPhones = computed(() => otherPhonesCount.value > 0);

const phoneOptions = computed(() =>
	dialablePhones.value.map(({ number }) => ({
		text: number,
		number,
	})),
);

function onPhoneOptionClick({
	option,
}: {
	option: {
		number?: string;
	};
}) {
	call(option.number);
}
</script>

<style scoped>
.contact-phones-cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.contact-phones-cell__more {
	cursor: pointer;
}

.contact-phones-cell__option {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}
</style>
