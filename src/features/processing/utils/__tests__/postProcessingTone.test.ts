import { describe, expect, it } from 'vitest';

import {
	getPostProcessingTone,
	PostProcessingTone,
} from '../postProcessingTone';

describe('getPostProcessingTone', () => {
	it.each([
		[
			100,
			PostProcessingTone.Success,
		],
		[
			67,
			PostProcessingTone.Success,
		],
		[
			66,
			PostProcessingTone.Warning,
		],
		[
			34,
			PostProcessingTone.Warning,
		],
		[
			33,
			PostProcessingTone.Error,
		],
		[
			0,
			PostProcessingTone.Error,
		],
	])('maps %i%% of the time left to %s', (percent, tone) => {
		expect(getPostProcessingTone(percent, 100)).toBe(tone);
	});

	it('clamps time left beyond the total to green', () => {
		expect(getPostProcessingTone(150, 100)).toBe(PostProcessingTone.Success);
	});

	it('stays green when the total is unknown', () => {
		expect(getPostProcessingTone(5, null)).toBe(PostProcessingTone.Success);
		expect(getPostProcessingTone(5, 0)).toBe(PostProcessingTone.Success);
	});
});
