<template>
	<section class="inbound-call-info-panel">
		<communication-info-header
			icon="ws-inbound-call"
			:color="IconColor.SUCCESS"
			:title="t('ui.call.direction.inbound')"
		>
			<template
				v-if="startedAt"
				#subtitle
			>
				{{ startedAt }}
			</template>
			<template
				v-if="content.answeredAt"
				#aside
			>
				<span class="inbound-call-info-panel__timer typo-heading-6">
					{{ duration }}
				</span>
			</template>
		</communication-info-header>
		<wt-divider />
		<communication-info-fields :fields="fields" />
	</section>
</template>

<script setup lang="ts">
import { WtDivider } from '@webitel/ui-sdk/components';
import { FormatDateMode, IconColor } from '@webitel/ui-sdk/enums';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { formatDate } from '@webitel/ui-sdk/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useElapsedSec } from '../../../../ui/composables/useElapsedSec';
import CommunicationInfoFields from '../../../../ui/sidebar/components/communication-info/communication-info-fields.vue';
import CommunicationInfoHeader from '../../../../ui/sidebar/components/communication-info/communication-info-header.vue';
import type { CommunicationInfoField } from '../../../../ui/sidebar/components/communication-info/types/CommunicationInfoField.types';
import type { CallInfoPanelContent } from '../../types/CallInfoPanelContent.types';

const props = defineProps<{
	content: CallInfoPanelContent;
}>();

const { t } = useI18n();

const startedAt = computed(() =>
	props.content.createdAt
		? `${t('ui.reusable.startedAt')}: ${formatDate(props.content.createdAt, FormatDateMode.TIME_SEC)}`
		: undefined,
);

// Same format as the call dock's timer: hours always shown.
const elapsedSec = useElapsedSec(() => props.content.answeredAt);
const duration = computed(() => convertDuration(elapsedSec.value));

const fields = computed<CommunicationInfoField[]>(() => [
	{
		key: 'from',
		label: t('reusable.from'),
		value: props.content.from,
	},
	{
		key: 'to',
		label: t('reusable.to'),
		value: props.content.to,
	},
	{
		key: 'queue',
		label: t('objects.queue.queue', 1),
		value: props.content.queueName,
	},
]);
</script>

<style scoped>
.inbound-call-info-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}
</style>
