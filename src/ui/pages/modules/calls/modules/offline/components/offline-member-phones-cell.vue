<template>
	<div class="offline-member-phones-cell">
		<template v-if="firstCommunication">
			<wt-button
				class="offline-member-phones-cell__call"
				icon="call--filled"
				:size="ComponentSize.SM"
				:color="ButtonColor.SUCCESS"
				:icon-color="IconColor.SUCCESS"
				:variant="ButtonVariant.TEXT"
				:loading="loading"
				:aria-label="t('ui.pages.contacts.phones.call', { number: firstCommunication.destination })"
				width-by-content
				@click="call(firstCommunication)"
			/>
			<span class="offline-member-phones-cell__number">{{ firstCommunication.destination }}</span>

			<wt-context-menu
				v-if="hasOtherCommunications"
				:options="communicationOptions"
				:disabled="loading"
				@click="onCommunicationOptionClick"
			>
				<template #activator="{ toggle }">
					<wt-tooltip>
						<template #activator>
							<wt-chip
								class="offline-member-phones-cell__more"
								:color="ChipColor.SECONDARY"
								@click="toggle"
							>
								+{{ otherCommunicationsCount }}
							</wt-chip>
						</template>
						{{ t('ui.pages.contacts.phones.moreNumbers', { count: otherCommunicationsCount }) }}
					</wt-tooltip>
				</template>

				<template #option="{ text }">
					<span class="offline-member-phones-cell__option">
						<wt-icon
							icon="call--filled"
							:size="ComponentSize.SM"
							:color="IconColor.SUCCESS"
						/>
						{{ text }}
					</span>
				</template>
			</wt-context-menu>
		</template>

		<span v-else>{{ t('ui.pages.contacts.phones.noPhone') }}</span>
	</div>
</template>

<script setup lang="ts">
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
import type { OfflineMemberCommunication } from '../types/OfflineMember.types';

const props = defineProps<{
	communications?: OfflineMemberCommunication[];
	loading?: boolean;
}>();

const emit = defineEmits<{
	call: [
		communication: OfflineMemberCommunication,
	];
}>();

const { t } = useI18n();

/**
 * The queue is asked to call a communication, not a number, so the whole
 * communication is emitted; ones without a destination cannot be called
 * and are dropped. A member has no primary communication: the first is shown
 * [WS-30](https://webitel.atlassian.net/browse/WS-30)
 */
const callableCommunications = computed(() =>
	(props.communications ?? []).filter(({ destination }) =>
		Boolean(destination),
	),
);

const firstCommunication = computed(() => callableCommunications.value[0]);

const otherCommunicationsCount = computed(
	() => callableCommunications.value.length - 1,
);

const hasOtherCommunications = computed(
	() => otherCommunicationsCount.value > 0,
);

const communicationOptions = computed(() =>
	callableCommunications.value.map((communication) => ({
		text: communication.destination,
		communication,
	})),
);

// one request at a time per member, as cc-workspaces' loader
function call(communication: OfflineMemberCommunication) {
	if (props.loading) return;
	emit('call', communication);
}

function onCommunicationOptionClick({
	option,
}: {
	option: {
		communication?: OfflineMemberCommunication;
	};
}) {
	if (option.communication) call(option.communication);
}
</script>

<style scoped>
.offline-member-phones-cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.offline-member-phones-cell__call {
	flex-shrink: 0;
}

.offline-member-phones-cell__more {
	cursor: pointer;
}

.offline-member-phones-cell__option {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}
</style>
