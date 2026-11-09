<template>
	<div class="contact-phones-cell">
		<template v-if="primaryPhoneNumber">
			<wt-button
				class="contact-phones-cell__call"
				icon="call--filled"
				:size="ComponentSize.SM"
				:color="ButtonColor.SUCCESS"
				:icon-color="ButtonColor.SUCCESS"
				:variant="ButtonVariant.TEXT"
				:aria-label="t('ui.pages.contacts.phones.call', { number: primaryPhoneNumber })"
				width-by-content
				@click="emit('call', primaryPhoneNumber)"
			/>
			<span class="contact-phones-cell__number">{{ primaryPhoneNumber }}</span>

			<wt-context-menu
				v-if="hasOtherPhones"
				:options="phoneOptions"
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

		<span v-else>{{ t('ui.pages.contacts.phones.noPhone') }}</span>
	</div>
</template>

<script setup lang="ts">
import type { ContactsPhoneNumber } from '@webitel/api-services/gen/models';
import {
	WtButton,
	WtChip,
	WtContextMenu,
	WtIcon,
	WtTooltip,
} from '@webitel/ui-sdk/components';
import {
	ButtonColor,
	ButtonVariant,
	ChipColor,
	ComponentSize,
	IconColor,
} from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	phones?: ContactsPhoneNumber[];
}>();

const emit = defineEmits<{
	call: [
		number: string,
	];
}>();

const { t } = useI18n();

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
	if (option.number) emit('call', option.number);
}
</script>

<style scoped>
.contact-phones-cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.contact-phones-cell__call {
	flex-shrink: 0;
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
