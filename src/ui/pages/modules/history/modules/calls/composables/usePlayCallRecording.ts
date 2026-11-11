import { getCallMediaUrl } from '@webitel/api-services/api';
import {
	type EngineCallFile,
	EngineCallFileType,
} from '@webitel/api-services/gen/models';
import { computed, ref } from 'vue';
import { getMediaUrlAuth } from '../../../../../../../app/scripts/getMediaUrlAuth';

export const usePlayCallRecording = () => {
	const playingFile = ref<EngineCallFile | null>(null);

	const playingSrc = computed(() =>
		playingFile.value?.id
			? {
					src: getCallMediaUrl(playingFile.value.id, {
						auth: getMediaUrlAuth(),
					}),
					type: playingFile.value.mimeType,
				}
			: undefined,
	);

	const isAudioOpen = computed(
		() => playingFile.value?.type === EngineCallFileType.FileTypeAudio,
	);
	const isVideoOpen = computed(
		() => playingFile.value?.type === EngineCallFileType.FileTypeVideo,
	);

	const play = (file: EngineCallFile) => {
		playingFile.value = file;
	};

	const close = () => {
		playingFile.value = null;
	};

	return {
		playingFile,
		playingSrc,
		isAudioOpen,
		isVideoOpen,
		play,
		close,
	};
};
