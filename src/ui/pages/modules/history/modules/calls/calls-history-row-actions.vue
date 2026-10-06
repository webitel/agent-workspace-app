<template>
	<div class="calls-history-row-actions">
		<calls-history-media-action
			:files="item.files"
			@play="emit('play', $event)"
		/>

		<wt-context-menu
			:options="menuOptions"
			@click="handleMenuClick"
		>
			<template #activator="{ toggle }">
				<wt-icon-btn
					icon="options"
					size="sm"
					@click="toggle"
				/>
			</template>

			<template #option="{ icon, text }">
				<div class="calls-history-row-actions__option typo-body-2">
					<wt-icon :icon="icon" />
					{{ text }}
				</div>
			</template>
		</wt-context-menu>
	</div>
</template>

<script setup lang="ts">
import type {
	EngineCallFile,
	EngineHistoryCall,
} from '@webitel/api-services/gen/models';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CallsHistoryMediaAction from './calls-history-media-action.vue';
import { CallMenuAction } from './enums/CallMenuAction.enum';
import { getMainCallId } from './scripts/getMainCallId';

const props = defineProps<{
	item: EngineHistoryCall;
}>();

const emit = defineEmits<{
	play: [
		file: EngineCallFile,
	];
	'show-info': [
		item: EngineHistoryCall,
	];
}>();

const { t } = useI18n();

const menuOptions = computed(() => [
	{
		value: CallMenuAction.ShowCallInfo,
		text: t('ui.pages.history.calls.actions.showCallInfo'),
		icon: 'call-info',
	},
	{
		value: CallMenuAction.OpenInHistory,
		text: t('reusable.openInHistory'),
		icon: 'history',
	},
]);

const openInHistory = () => {
	const url = `${import.meta.env.VITE_HISTORY_URL}/view/call_view/${getMainCallId(props.item)}`;
	window.open(url, '_blank', 'noopener');
};

const menuActions: Record<CallMenuAction, () => void> = {
	[CallMenuAction.ShowCallInfo]: () => emit('show-info', props.item),
	[CallMenuAction.OpenInHistory]: openInHistory,
};

const handleMenuClick = ({
	option,
}: {
	option: {
		value: CallMenuAction;
	};
}) => menuActions[option.value]();
</script>

<style scoped>
.calls-history-row-actions {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.calls-history-row-actions__option {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.calls-history-row-actions__option .wt-icon {
	--icon-color: var(--wt-ws-chat-queue-pannel-colors-chat-end-reason-indicator-color);
}

.wt-icon-btn {
	padding: var(--spacing-xs);
}
</style>