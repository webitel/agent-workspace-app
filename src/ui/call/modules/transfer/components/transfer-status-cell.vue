<template>
	<div class="transfer-status-cell">
		<wt-badge
			:hidden="!status"
			:icon-badge="status"
			:color-variable="colorVariable"
		/>
		{{ label }}
	</div>
</template>

<script
	setup
	lang="ts"
>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { TransferAgentStatus } from '../enums/TransferAgentStatus.enum';
import { TRANSFER_AGENT_BADGE_COLOR_VARIABLES } from '../mappings/transferAgentStatusColors';
import { TRANSFER_AGENT_STATUS_LABEL_KEYS } from '../mappings/transferAgentStatusLabelKeys';

const props = defineProps<{
	status?: TransferAgentStatus;
}>();

const { t } = useI18n();

const colorVariable = computed(
	() => props.status && TRANSFER_AGENT_BADGE_COLOR_VARIABLES[props.status],
);

/**
 * @author Oleksandr Palonnyi
 * TODO: the label is drawn beside wt-badge by hand until the component can
 * show a status text itself; refactor after that component update
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
const label = computed(() =>
	props.status ? t(TRANSFER_AGENT_STATUS_LABEL_KEYS[props.status]) : '',
);
</script>

<style scoped>
.transfer-status-cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}
</style>
