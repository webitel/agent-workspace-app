import {
	type EngineCallFile,
	EngineCallFileType,
} from '@webitel/api-services/gen/models';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@webitel/api-services/api', () => ({
	getCallMediaUrl: (id: string) => `media/${id}`,
}));

import { usePlayCallRecording } from '../usePlayCallRecording';

const audio: EngineCallFile = {
	id: '1',
	name: 'call.mp3',
	mimeType: 'audio/mpeg',
	type: EngineCallFileType.FileTypeAudio,
};

const video: EngineCallFile = {
	id: '2',
	name: 'call.mp4',
	mimeType: 'video/mp4',
	type: EngineCallFileType.FileTypeVideo,
};

describe('usePlayCallRecording', () => {
	it('has nothing open initially', () => {
		const { playingFile, playingSrc, isAudioOpen, isVideoOpen } =
			usePlayCallRecording();

		expect(playingFile.value).toBeNull();
		expect(playingSrc.value).toBeUndefined();
		expect(isAudioOpen.value).toBe(false);
		expect(isVideoOpen.value).toBe(false);
	});

	it('opens the audio player for an audio file', () => {
		const { play, playingFile, playingSrc, isAudioOpen, isVideoOpen } =
			usePlayCallRecording();

		play(audio);

		expect(playingFile.value).toEqual(audio);
		expect(playingSrc.value).toEqual({
			src: 'media/1',
			type: 'audio/mpeg',
		});
		expect(isAudioOpen.value).toBe(true);
		expect(isVideoOpen.value).toBe(false);
	});

	it('opens the video player for a video file', () => {
		const { play, playingSrc, isAudioOpen, isVideoOpen } =
			usePlayCallRecording();

		play(video);

		expect(playingSrc.value).toEqual({
			src: 'media/2',
			type: 'video/mp4',
		});
		expect(isAudioOpen.value).toBe(false);
		expect(isVideoOpen.value).toBe(true);
	});

	it('switches to another file without closing first', () => {
		const { play, isAudioOpen, isVideoOpen } = usePlayCallRecording();

		play(audio);
		play(video);

		expect(isAudioOpen.value).toBe(false);
		expect(isVideoOpen.value).toBe(true);
	});

	it('closes the player', () => {
		const { play, close, playingFile, playingSrc, isAudioOpen } =
			usePlayCallRecording();

		play(audio);
		close();

		expect(playingFile.value).toBeNull();
		expect(playingSrc.value).toBeUndefined();
		expect(isAudioOpen.value).toBe(false);
	});

	it('has no source for a file without id', () => {
		const { play, playingSrc } = usePlayCallRecording();

		play({
			...audio,
			id: undefined,
		});

		expect(playingSrc.value).toBeUndefined();
	});

	it('keeps state separate between instances', () => {
		const first = usePlayCallRecording();
		const second = usePlayCallRecording();

		first.play(audio);

		expect(second.playingFile.value).toBeNull();
	});
});
