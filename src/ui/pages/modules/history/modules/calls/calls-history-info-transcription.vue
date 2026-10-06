<template>
	<div
		v-if="transcriptOptions.length"
		class="calls-history-info-transcription"
	>
		<wt-single-select
			v-model="selectedTranscriptId"
			:options="transcriptOptions"
			:show-clear="false"
			option-value="id"
		/>

		<wt-loader v-if="isLoading" />
		<wt-table
			v-else
			:data="phrases"
			:headers="headers"
			:selectable="false"
			:grid-actions="false"
			data-key="id"
			headless
		/>
	</div>

	<wt-empty
		v-else
		:image="emptyImage"
		:text="t('ui.reusable.nothingToShowHere')"
	/>
</template>

<script setup lang="ts">
import type { EngineTranscriptLookup } from '@webitel/api-services/gen/models';
import { WtTable } from '@webitel/ui-sdk/components';
import { useMinDurationLoader } from '@webitel/ui-sdk/composables';
import emptyTableDark from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-table-dark.svg';
import emptyTableLight from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-table-light.svg';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useThemedImage } from '../../../../../../app/composables/useThemedImage';
import { getTranscriptPhrases } from './api/transcriptApi';
import type { TranscriptPhrase } from './types/CallInfo.types';

const props = defineProps<{
	transcripts?: EngineTranscriptLookup[];
}>();

const { t } = useI18n();

const { isLoading, runWithMinDuration } = useMinDurationLoader();

const emptyImage = useThemedImage({
	light: emptyTableLight,
	dark: emptyTableDark,
});

const headers = [
	{
		value: 'time',
		locale: 'vocabulary.time',
	},
	{
		value: 'phrase',
		locale: 'vocabulary.text',
	},
];

const phrases = ref<TranscriptPhrase[]>([]);

const transcriptOptions = computed(() =>
	(props.transcripts ?? []).map(({ id, file }) => ({
		id,
		label: file?.name,
	})),
);

const selectedTranscriptId = ref(transcriptOptions.value[0]?.id);

const loadPhrases = (id?: string) => {
	if (!id) return;

	runWithMinDuration(async () => {
		try {
			const loadedPhrases = await getTranscriptPhrases(id);
			if (id === selectedTranscriptId.value) phrases.value = loadedPhrases;
		} catch {
			phrases.value = [];
		}
	});
};

watch(selectedTranscriptId, loadPhrases, {
	immediate: true,
});
</script>

<style scoped>
.calls-history-info-transcription {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
}

.calls-history-info-transcription .wt-loader {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.wt-empty {
	height: 100%;
}
</style>
