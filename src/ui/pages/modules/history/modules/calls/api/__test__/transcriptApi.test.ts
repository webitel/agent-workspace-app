import { beforeEach, describe, expect, it, vi } from 'vitest';

const getTranscript = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	CallTranscriptAPI: {
		get: (...args: unknown[]) => getTranscript(...args),
	},
}));

import { getTranscriptPhrases } from '../transcriptApi';

describe('getTranscriptPhrases', () => {
	beforeEach(() => {
		getTranscript.mockReset();
	});

	it('requests phrases by transcript id', async () => {
		getTranscript.mockResolvedValue([]);

		await getTranscriptPhrases('5');

		expect(getTranscript).toHaveBeenCalledWith({
			id: '5',
		});
	});

	it('maps phrases to table rows', async () => {
		getTranscript.mockResolvedValue([
			{
				startSec: 0,
				endSec: 2.5,
				phrase: 'Hello',
			},
			{
				startSec: 3,
				endSec: 4,
				phrase: 'Hi',
			},
		]);

		await expect(getTranscriptPhrases('5')).resolves.toEqual([
			{
				id: 0,
				time: '0 - 2.5',
				phrase: 'Hello',
			},
			{
				id: 1,
				time: '3 - 4',
				phrase: 'Hi',
			},
		]);
	});

	it('uses an empty string for a missing phrase', async () => {
		getTranscript.mockResolvedValue([
			{
				startSec: 0,
				endSec: 1,
			},
		]);

		const [row] = await getTranscriptPhrases('5');

		expect(row.phrase).toBe('');
	});
});
