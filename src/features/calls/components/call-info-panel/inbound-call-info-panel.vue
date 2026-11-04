<template>
	<section class="inbound-call-info-panel">
		<call-info-panel-header
			icon="ws-inbound-call"
			:tone="IconColor.SUCCESS"
			:title="t('ui.call.direction.inbound')"
			:created-at="content.createdAt"
			:answered-at="content.answeredAt"
		/>
		<wt-divider />
		<call-info-panel-fields :fields="fields" />
	</section>
</template>

<script setup lang="ts">
import { WtDivider } from '@webitel/ui-sdk/components';
import { IconColor } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { CallInfoPanelContent } from '../../types/CallInfoPanelContent.types';
import type { CallInfoPanelField } from '../../types/CallInfoPanelField.types';
import CallInfoPanelFields from './call-info-panel-fields.vue';
import CallInfoPanelHeader from './call-info-panel-header.vue';

const props = defineProps<{
	content: CallInfoPanelContent;
}>();

const { t } = useI18n();

const fields = computed<CallInfoPanelField[]>(() => [
	{
		label: t('reusable.from'),
		value: props.content.from,
	},
	{
		label: t('reusable.to'),
		value: props.content.to,
	},
	{
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
