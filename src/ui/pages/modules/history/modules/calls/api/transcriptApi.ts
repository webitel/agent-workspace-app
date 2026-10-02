import { CallTranscriptAPI } from '@webitel/api-services/api';
import { applyTransform } from '@webitel/api-services/api/transformers';
import type { StorageTranscriptPhrase } from '@webitel/api-services/gen/models';
import type { TranscriptPhrase } from '../types/CallInfo.types';

const phrasesTransformer = (
	phrases: StorageTranscriptPhrase[],
): TranscriptPhrase[] =>
	phrases.map(({ startSec, endSec, phrase = '' }, index) => ({
		id: index,
		time: `${startSec} - ${endSec}`,
		phrase,
	}));

export const getTranscriptPhrases = async (
	id: string,
): Promise<TranscriptPhrase[]> => {
	const phrases = await CallTranscriptAPI.get({
		id,
	});
	return applyTransform<TranscriptPhrase[]>(phrases, [
		phrasesTransformer,
	]);
};
