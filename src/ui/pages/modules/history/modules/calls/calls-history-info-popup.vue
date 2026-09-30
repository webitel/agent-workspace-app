<template>
	<wt-popup
		:size="ComponentSize.MD"
		:height="ComponentSize.LG"
		@close="emit('close')"
	>
		<template #title>
			{{ t('ui.pages.history.calls.callInfo.title') }}
		</template>

		<template #main>
			<div class="calls-history-info-popup__content">
				<wt-tabs
					:current="activeTabConfig"
					:tabs="tabs"
					@change="activeTab = $event.value"
				/>

				<div class="calls-history-info-popup__panel wt-scrollbar">
					<wt-loader v-if="isLoading" />
					<component
						v-else="activeTabConfig?.component"
						:is="activeTabConfig.component"
						v-bind="activeTabConfig.props"
					/>
				</div>
			</div>
		</template>

		<template #actions>
			<wt-button
				color="secondary"
				@click="emit('close')"
			>
				{{ t('reusable.close') }}
			</wt-button>
		</template>
	</wt-popup>
</template>

<script setup lang="ts">
import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { useMinDurationLoader } from '@webitel/ui-sdk/composables';
import { ComponentSize } from '@webitel/ui-sdk/enums';

import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getCallInfo } from './api/callInfoApi';
import CallsHistoryInfoVariables from './calls-history-info-variables.vue';
import { CallInfoTab } from './enums/CallInfoTab.enum';

const props = defineProps<{
	item: EngineHistoryCall;
}>();

const emit = defineEmits<{
	close: [];
}>();

const { t } = useI18n();
const { isLoading, runWithMinDuration } = useMinDurationLoader();

const activeTab = ref<CallInfoTab>(CallInfoTab.Variables);
const callInfo = ref<EngineHistoryCall | null>(null);

const tabs = computed(() => [
	{
		value: CallInfoTab.Variables,
		text: t('vocabulary.variables', 2),
		component: CallsHistoryInfoVariables,
		props: {
			variables: callInfo.value?.variables,
		},
	},
	{
		value: CallInfoTab.Postprocessing,
		text: t('ui.pages.history.calls.callInfo.postprocessing'),
	},
	{
		value: CallInfoTab.Transcription,
		text: t('objects.transcription'),
	},
]);

const activeTabConfig = computed(() =>
	tabs.value.find(({ value }) => value === activeTab.value),
);

const mainCallId = computed(() => props.item.parentId || props.item.id);

const loadCallInfo = () => {
	const id = mainCallId.value;
	if (!id) return;

	runWithMinDuration(async () => {
		try {
			callInfo.value = (await getCallInfo(id)) ?? null;
		} catch {
			callInfo.value = null;
		}
	});
};

loadCallInfo();
</script>

<style scoped>
.calls-history-info-popup__content {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	height: 100%;
}

.calls-history-info-popup__content .wt-loader {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.calls-history-info-popup__panel {
	flex-grow: 1;
	min-height: 0;
	overflow-y: auto;
}
</style>