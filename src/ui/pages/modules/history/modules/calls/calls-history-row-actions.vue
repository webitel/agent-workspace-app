<template>
	<div class="calls-history-row-actions">
		<calls-history-media-action
			:files="item.files"
			@play="emit('play', $event)"
		/>

		<wt-context-menu
			:options="menuOptions"
			@click="emit('show-info', item)"
		>
			<template #activator="{ toggle }">
				<wt-icon-btn
					icon="options"
					size="sm"
					@click="toggle"
				/>
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

defineProps<{
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
		text: t('ui.pages.history.calls.actions.showCallInfo'),
	},
]);
</script>

<style scoped>
.calls-history-row-actions {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}
</style>