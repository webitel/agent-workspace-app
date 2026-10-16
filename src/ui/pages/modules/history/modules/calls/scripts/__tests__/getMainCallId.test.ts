import { describe, expect, it } from 'vitest';

import { getMainCallId } from '../getMainCallId';

describe('getMainCallId', () => {
	it('returns parentId for a child call leg', () => {
		expect(
			getMainCallId({
				id: 'child',
				parentId: 'parent',
			}),
		).toBe('parent');
	});

	it('returns id for a main call', () => {
		expect(
			getMainCallId({
				id: 'main',
			}),
		).toBe('main');
	});

	it('returns id when parentId is empty', () => {
		expect(
			getMainCallId({
				id: 'main',
				parentId: '',
			}),
		).toBe('main');
	});
});
