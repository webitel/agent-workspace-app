<template>
	<div
		v-if="!recordings.length"
		class="calls-history-media-action calls-history-media-action__activator"
	>
		<wt-icon-btn
			size="sm"
			icon="play"
			disabled
		/>
	</div>

	<div
		v-else-if="recordings.length === 1"
		class="calls-history-media-action calls-history-media-action__activator"
	>
		<wt-icon-btn
			icon="play"
			size="sm"
			@click="emit('play', recordings[0])"
		/>
	</div>


	<wt-context-menu
		v-else
		:options="menuOptions"
		class="calls-history-media-action"
		@click="({ option }) => emit('play', option.file)"
	>
		<template #activator="{ toggle }">
			<div class="calls-history-media-action__activator">
				<wt-icon-btn
					icon="play"
					size="sm"
					@click="toggle"
				/>
			</div>
		</template>

		<template #option="{ text, icon }">
			<div class="calls-history-media-action__option typo-body-2">
				<wt-icon :icon="icon" />
				{{ text }}
			</div>
		</template>
	</wt-context-menu>
</template>

<script setup lang="ts">
import {
	type EngineCallFile,
	EngineCallFileType,
} from '@webitel/api-services/gen/models';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	files?: EngineCallFile[];
}>();

const emit = defineEmits<{
	play: [
		file: EngineCallFile,
	];
}>();

const { t } = useI18n();

// files also contain screenshots, pdfs etc. — only audio/video are playable
const audioFiles = computed(
	() =>
		props.files?.filter(
			({ type }) => type === EngineCallFileType.FileTypeAudio,
		) ?? [],
);
const videoFiles = computed(
	() =>
		props.files?.filter(
			({ type }) => type === EngineCallFileType.FileTypeVideo,
		) ?? [],
);

const recordings = computed(() => [
	...audioFiles.value,
	...videoFiles.value,
]);

const getRecordingLabel = (file: EngineCallFile) =>
	file.type === EngineCallFileType.FileTypeAudio
		? t('ui.pages.history.calls.recordings.playAudio')
		: t('ui.pages.history.calls.recordings.playVideo');

const menuOptions = computed(() =>
	recordings.value.map((file) => ({
		text: getRecordingLabel(file),
		icon:
			file.type === EngineCallFileType.FileTypeAudio ? 'play' : 'ws-play-video',
		file,
	})),
);
</script>

<style scoped>
.calls-history-media-action__option {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.calls-history-media-action__option .wt-icon {
	--icon-color: var(--wt-ws-chat-queue-pannel-colors-chat-end-reason-indicator-color);
}

.calls-history-media-action__activator {
	padding: var(--spacing-xs);
}

.calls-history-media-action__activator .wt-icon-btn {
	--icon-color: var(--wt-ws-chat-queue-pannel-colors-chat-end-reason-indicator-color);
}
</style>